const { ethers } = require("hardhat");

async function deploy(contractName, signer, ...args) {
    const Factory = await ethers.getContractFactory(contractName, signer)
    const instance = await Factory.deploy(...args)
    return instance.deployed()
}

async function main() {
    let admin;
    [admin] = await ethers.getSigners();

    console.log("Deploying multicall contract with the account:", admin.address);
    console.log("Account balance:", (await admin.getBalance()).toString());

    // Deploy Multicall
    console.log("Deploying contract...")
    multicall = await deploy("Multicall", admin, admin.address);

    // Print address
    console.log("Multicall address: " + factory.address);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});