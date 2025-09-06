import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
        cb(new Error('File size too large. Maximum size is 100MB'));
        return;
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 1
    }
});

export const uploadSingle = upload.single('file');