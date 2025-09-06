const { ethers, artifacts } = require ("hardhat");
const fs = require("fs");
require('dotenv').config();

(async function () {

    const contract = await ethers.getContractFactory("main").then((contract) => contract.deploy(process.env.ROFL_PUBLIC_KEY));
    const contractsDir = __dirname + "/../data";
    if (!fs.existsSync(contractsDir)) {fs.mkdirSync(contractsDir);} else {

        fs.writeFileSync(
            contractsDir + `/address.json`,
            JSON.stringify({ address : contract.address }, undefined, 2)
        );
            
        fs.writeFileSync(
            contractsDir + `/abi.json`,
            JSON.stringify({ abi : artifacts.readArtifactSync("main").abi }, null, 2)
        );

    }

})().then(() => {process.exit(0);}).catch((error) => {console.error(error); process.exit(1);});