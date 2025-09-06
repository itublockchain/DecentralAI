/*
 * Node.js backend: ingest file -> fetch encrypted vector DB from IPFS -> decrypt ->
 * parse/clean/chunk -> embed -> domain-guard -> append -> re-encrypt -> upload to IPFS -> return new CID.
 *
 * New feature in this revision:
 *   - **Domain Guard** to block off-topic uploads (e.g., dataset is "health", someone uploads "automotive").
 *     Uses two signals:
 *       (1) Similarity to existing store centroid (cosine) with a threshold.
 *       (2) Zero-shot label check using embedding similarity against label prompts ("healthcare", "automotive", ...).
 *     If either says "off-topic" with margin, we reject with 409.
 *
 * Endpoints:
 *   POST /ingest (multipart form)
 *     - fields:
 *         file: uploaded document (txt/pdf/docx/csv/xlsx/json)
 *         existing_manifest_cid (optional): IPFS CID of current encrypted snapshot manifest
 *     - returns: JSON { ok, new_manifest_cid, snapshot_cid, counts }
 *
 * Vector DB format (simple file-based store for PoC):
 *   - snapshot.tar.enc (AES-256-GCM) containing
 *       /vectors.jsonl     -> one JSON per line: { id, vector:[...], meta:{} }
 *       /manifest.json     -> schema/version info incl. domain_profile
 *   - We re-pack the snapshot entirely on each ingest (simple path). For scale, add deltas.
 *
 * Crypto:
 *   - Symmetric AES-256-GCM. Key is derived from process.env.PRIVATE_KEY (string/hex)
 *     using scrypt with a random salt per snapshot. Salt stored in manifest.
 *   - Nonce (iv) is random per encryption.
 *
 * Embeddings:
 *   - OpenAI Embeddings (text-embedding-3-small by default). Set OPENAI_API_KEY.
 *
 * IPFS:
 *   - Uses ipfs-http-client; point IPFS_URL to your node/gateway with API access
 *     (e.g., http://127.0.0.1:5001 or an Infura endpoint).
 *
 * To run:
 *   npm i express multer dotenv ipfs-http-client openai pdf-parse mammoth xlsx tar fs-extra tmp crypto
 *   node index.js
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { create } = require('ipfs-http-client');
const tar = require('tar');
const mammoth = require('mammoth'); // docx => HTML/text
const xlsx = require('xlsx'); // csv/xlsx
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// ---------- Config ----------
const PORT = process.env.PORT || 3000;
const IPFS_URL = process.env.IPFS_URL || 'http://127.0.0.1:5001';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'dev-only-change-me'; // used to derive AES key
const MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
// Domain Guard configuration (dataset theme)
const DATASET_DOMAIN = process.env.DATASET_DOMAIN || 'healthcare';
const SIM_THRESHOLD = parseFloat(process.env.SIM_THRESHOLD || '0.76'); // centroid similarity
const LABEL_MARGIN = parseFloat(process.env.LABEL_MARGIN || '0.07');   // label gap needed to accept off-topic claim

const ipfs = create({ url: IPFS_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const upload = multer({ dest: path.join(os.tmpdir(), 'uploads') });

// ---------- Helpers: Crypto ----------
async function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, { N: 1 << 15, r: 8, p: 1 }, (err, dk) => {
      if (err) reject(err); else resolve(dk);
    });
  });
}

async function encryptFileGCM(inputPath, outputPath, password) {
  const salt = crypto.randomBytes(16);
  const key = await deriveKey(password, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  const inStream = fs.createReadStream(inputPath);
  const outStream = fs.createWriteStream(outputPath);
  await streamPipeline(inStream, cipher, outStream);
  const tag = cipher.getAuthTag();
  return { salt: salt.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64') };
}

async function decryptFileGCM(inputPath, outputPath, password, { salt, iv, tag }) {
  const key = await deriveKey(password, Buffer.from(salt, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  const inStream = fs.createReadStream(inputPath);
  const outStream = fs.createWriteStream(outputPath);
  await streamPipeline(inStream, decipher, outStream);
}

// ---------- Helpers: IPFS ----------
async function ipfsAddFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const { cid } = await ipfs.add({ content: fileStream });
  return cid.toString();
}

async function ipfsGetToFile(cid, outPath) {
  await fsp.mkdir(path.dirname(outPath), { recursive: true });
  const res = ipfs.cat(cid);
  const out = fs.createWriteStream(outPath);
  for await (const chunk of res) {
    out.write(chunk);
  }
  out.end();
  await new Promise((r) => out.on('finish', r));
}

// ---------- Helpers: Parsing & Chunking ----------
function normalizeWhitespace(s) {
  return s.replace(/
?/g, '
').replace(/	/g, ' ').replace(/[  ]+/g, ' ').replace(/
{3,}/g, '

').trim();
}

async function extractText(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  if (ext === '.txt' || ext === '.md' || ext === '.csv') {
    // For CSV, fall through to xlsx path below if you prefer schema-aware; here read as text
    const raw = await fsp.readFile(filePath, 'utf8');
    return normalizeWhitespace(raw);
  }
  if (ext === '.pdf') {
    const data = await pdfParse(await fsp.readFile(filePath));
    return normalizeWhitespace(data.text || '');
  }
  if (ext === '.docx') {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return normalizeWhitespace(value || '');
  }
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    const wb = xlsx.readFile(filePath);
    const parts = [];
    wb.SheetNames.forEach((name) => {
      const ws = wb.Sheets[name];
      const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
      if (!rows || rows.length === 0) return;
      const header = rows[0].map((h) => String(h || '').trim());
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const kv = header.map((h, j) => `${h}=${(r[j] ?? '').toString().trim()}`).join(', ');
        parts.push(`Sheet=${name} | Row=${i} | ${kv}`);
      }
    });
    return parts.join('
');
  }
  if (ext === '.json') {
    const obj = JSON.parse(await fsp.readFile(filePath, 'utf8'));
    return normalizeWhitespace(JSON.stringify(obj, null, 2));
  }
  // Fallback: treat as utf-8 text
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return normalizeWhitespace(raw);
  } catch {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

function chunkText(text, opts = { maxTokens: 1000, overlap: 200 }) {
  // Character-based approximation (4 chars ~ 1 token). For prod, use a tokenizer.
  const size = (opts.maxTokens || 1000) * 4;
  const ov = (opts.overlap || 200) * 4;
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const j = Math.min(text.length, i + size);
    const slice = text.slice(i, j);
    chunks.push(slice);
    i = j - ov;
    if (i < 0) i = 0;
  }
  return chunks;
}

async function embedTexts(texts) {
  if (!texts.length) return [];
  const resp = await openai.embeddings.create({
    model: MODEL,
    input: texts
  });
  return resp.data.map((d) => d.embedding);
}

// ---------- Domain Guard (centroid + zero-shot labels) ----------
const LABELS = [
  'healthcare', 'medical records', 'clinical trials', 'pharmacy', 'insurance',
  'automotive', 'vehicles', 'cars', 'finance', 'banking', 'education'
];
let LABEL_EMBEDS = null; // cached at runtime

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

function averageVector(vectors) {
  if (!vectors.length) return null;
  const dim = vectors[0].vector ? vectors[0].vector.length : vectors[0].length;
  const out = new Array(dim).fill(0);
  let n = 0;
  for (const v of vectors) {
    const arr = v.vector || v;
    if (!arr || arr.length !== dim) continue;
    for (let i = 0; i < dim; i++) out[i] += arr[i];
    n++;
  }
  if (n === 0) return null;
  for (let i = 0; i < dim; i++) out[i] /= n;
  return out;
}

async function ensureLabelEmbeddings() {
  if (LABEL_EMBEDS) return LABEL_EMBEDS;
  const embs = await embedTexts(LABELS);
  LABEL_EMBEDS = embs;
  return LABEL_EMBEDS;
}

async function domainGuardDecision({ storeVectors, newEmbeds, datasetDomain = DATASET_DOMAIN }) {
  // Signal 1: centroid similarity
  const centroid = averageVector(storeVectors);
  const avgNew = averageVector(newEmbeds);
  let simToCentroid = null;
  if (centroid && avgNew) simToCentroid = cosineSim(centroid, avgNew);

  // Signal 2: zero-shot label ranking
  await ensureLabelEmbeddings();
  const lblEmbeds = LABEL_EMBEDS;
  const labelScores = LABELS.map((lbl, i) => ({ lbl, score: cosineSim(avgNew, lblEmbeds[i]) }));
  labelScores.sort((a, b) => b.score - a.score);
  const top = labelScores[0];
  const second = labelScores[1] || { score: -1 };

  const domainIsTop = top.lbl.toLowerCase().includes(datasetDomain.toLowerCase());
  const margin = top.score - second.score;

  const reasons = { simToCentroid, topLabel: top.lbl, topScore: top.score, margin };

  // Decision policy:
  //  - If we have centroid and sim < SIM_THRESHOLD -> reject.
  //  - OR if zero-shot top label is NOT our domain AND (margin > LABEL_MARGIN) -> reject.
  let reject = false;
  if (simToCentroid !== null && simToCentroid < SIM_THRESHOLD) reject = true;
  if (!domainIsTop && margin > LABEL_MARGIN) reject = true;

  return { reject, reasons, centroid };
}

// ---------- Helpers: Vector Store Format ----------
// vectors.jsonl lines: { id, vector:[...], meta:{ source, createdAt, chunkIndex, hash } }

async function loadVectorStoreFromSnapshotEnc(encPath, workDir, cryptoMeta) {
  const tarPath = path.join(workDir, 'snapshot.tar');
  await decryptFileGCM(encPath, tarPath, PRIVATE_KEY, cryptoMeta);
  await tar.extract({ file: tarPath, cwd: workDir });
  const vectorsPath = path.join(workDir, 'vectors.jsonl');
  const manifestPath = path.join(workDir, 'manifest.json');
  const vectors = fs.existsSync(vectorsPath)
    ? (await fsp.readFile(vectorsPath, 'utf8')).split('
').filter(Boolean).map((l) => JSON.parse(l))
    : [];
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(await fsp.readFile(manifestPath, 'utf8'))
    : { version: 1, model: MODEL, createdAt: new Date().toISOString() };
  return { vectors, manifest, vectorsPath, manifestPath };
}

async function saveVectorStoreAndEncrypt({ vectors, manifest, workDir }) {
  const vectorsPath = path.join(workDir, 'vectors.jsonl');
  const manifestPath = path.join(workDir, 'manifest.json');
  await fsp.writeFile(vectorsPath, vectors.map((v) => JSON.stringify(v)).join('
') + '
', 'utf8');
  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  const tarPath = path.join(workDir, 'snapshot.tar');
  await tar.create({ file: tarPath, cwd: workDir }, ['vectors.jsonl', 'manifest.json']);
  const encPath = path.join(workDir, 'snapshot.tar.enc');
  const encMeta = await encryptFileGCM(tarPath, encPath, PRIVATE_KEY);
  return { encPath, encMeta };
}

function sha256Hex(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

// ---------- API ----------
app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/ingest', upload.single('file'), async (req, res) => {
  const { existing_manifest_cid } = req.body;
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'file is required (multipart form-data)' });
  }

  const tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'vectordb-'));
  const tmpIn = path.join(tmpRoot, 'in');
  const tmpWork = path.join(tmpRoot, 'work');
  await fsp.mkdir(tmpIn); await fsp.mkdir(tmpWork);

  let vectors = [];
  let manifest = { version: 1, model: MODEL, createdAt: new Date().toISOString(), domain_profile: null };
  let counts = { existing: 0, added: 0 };

  try {
    // 1) If we have an existing manifest CID, fetch & decrypt snapshot
    if (existing_manifest_cid) {
      const manifestPathEnc = path.join(tmpIn, 'manifest.enc.json');
      await ipfsGetToFile(existing_manifest_cid, manifestPathEnc);
      const encManifest = JSON.parse(await fsp.readFile(manifestPathEnc, 'utf8'));
      const encSnapshotPath = path.join(tmpIn, 'snapshot.tar.enc');
      await ipfsGetToFile(encManifest.snapshot.cid, encSnapshotPath);

      const { vectors: v2, manifest: m2 } = await loadVectorStoreFromSnapshotEnc(
        encSnapshotPath,
        tmpWork,
        encManifest.snapshot.crypto
      );
      vectors = v2; manifest = { ...manifest, ...m2 }; counts.existing = vectors.length;
    }

    // 2) Parse/clean/chunk
    const originalName = req.file.originalname;
    const text = await extractText(req.file.path, originalName);
    const chunks = chunkText(text, { maxTokens: 1000, overlap: 200 });

    // 3) Embed
    const embeddings = await embedTexts(chunks);

    // 4) Domain Guard decision BEFORE appending
    const dg = await domainGuardDecision({ storeVectors: vectors, newEmbeds: embeddings, datasetDomain: DATASET_DOMAIN });
    if (dg.reject) {
      return res.status(409).json({ ok: false, reason: 'off-topic', details: dg.reasons });
    }

    // 5) Append to vectors
    const now = new Date().toISOString();
    const baseId = sha256Hex(originalName + now).slice(0, 16);
    embeddings.forEach((vec, idx) => {
      const rec = {
        id: `${baseId}-${idx}`,
        vector: vec,
        meta: {
          source: originalName,
          chunkIndex: idx,
          createdAt: now,
          length: chunks[idx].length,
          hash: sha256Hex(chunks[idx])
        }
      };
      vectors.push(rec);
    });
    counts.added = embeddings.length;

    // 6) Update domain profile (centroid EMA)
    const newCentroid = averageVector(vectors);
    manifest.domain_profile = {
      domain: DATASET_DOMAIN,
      centroid: newCentroid, // Note: this grows with store; for big stores consider reservoir sampling
      updatedAt: now,
      sim_threshold: SIM_THRESHOLD,
      label_margin: LABEL_MARGIN
    };

    // 7) Save -> tar -> encrypt
    const newEpoch = (manifest.epoch || 0) + 1;
    manifest = { ...manifest, epoch: newEpoch, updatedAt: now };
    const { encPath, encMeta } = await saveVectorStoreAndEncrypt({ vectors, manifest, workDir: tmpWork });

    // 8) Upload encrypted snapshot to IPFS
    const snapshot_cid = await ipfsAddFile(encPath);

    // 9) Small manifest for snapshot
    const smallManifest = {
      version: 1,
      model: manifest.model,
      epoch: manifest.epoch,
      snapshot: {
        cid: snapshot_cid,
        crypto: encMeta,
        size_bytes: (await fsp.stat(encPath)).size
      },
      software: { pipeline: 'node-poC', embeddings: MODEL },
      // store centroid preview for quick checks (optional, rounded)
      domain_profile: manifest.domain_profile ? { ...manifest.domain_profile, centroid: undefined } : null
    };

    const smallManifestPath = path.join(tmpWork, 'manifest.enc.json');
    await fsp.writeFile(smallManifestPath, JSON.stringify(smallManifest, null, 2), 'utf8');
    const new_manifest_cid = await ipfsAddFile(smallManifestPath);

    // 10) Respond
    res.json({ ok: true, new_manifest_cid, snapshot_cid, counts, domain_guard: dg.reasons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    try { await fsp.rm(tmpRoot, { recursive: true, force: true }); } catch {}
    try { await fsp.rm(req.file.path, { force: true }); } catch {}
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});

/*
.env example
-----------
PORT=3000
IPFS_URL=http://127.0.0.1:5001
PRIVATE_KEY=replace-with-strong-secret
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
# Domain guard configs
DATASET_DOMAIN=healthcare
SIM_THRESHOLD=0.76
LABEL_MARGIN=0.07

curl example
------------
# First time (no existing manifest)
curl -F "file=@/path/to/doc.pdf" http://localhost:3000/ingest

# Subsequent (append to existing store) with domain guard
curl -F "file=@/path/to/new.xlsx" -F "existing_manifest_cid=bafy..." http://localhost:3000/ingest

Notes
-----
- Domain Guard combines centroid similarity and zero-shot label similarity. Tune SIM_THRESHOLD and LABEL_MARGIN.
- For cold start (no existing vectors), only label check applies.
- For stronger guarantees, add a curated keyword whitelist/blacklist and require consensus.
- For scale, replace JSONL store with Qdrant/Milvus snapshots; logic remains the same.
*/
