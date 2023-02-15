const { ethers } = require("hardhat");

async function deploy(contractName, signer, ...args) {
    const Factory = await ethers.getContractFactory(contractName, signer)
    const instance = await Factory.deploy(...args)
    return instance.deployed()
}

async function main() {
    let admin;

    let router, factory;

    [admin] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", admin.address);
    console.log("Account balance:", (await admin.getBalance()).toString());

    // Deploy Factory
    factory = await deploy("UniswapV2Factory", admin, admin.address);
    
    // WETH
    const WETH_ADDRESS = '0xE99500AB4A413164DA49Af83B9824749059b46ce';

    // Deploy Router
    router = await deploy("UniswapV2Router02", admin, factory.address, WETH_ADDRESS);

    // Print addresses and init hash code
    console.log("Factory address: " + factory.address);
    console.log("WETH address: " + WETH_ADDRESS);
    console.log("Router address: " + router.address);
    console.log("Creation code: ", await factory.getInitHash());
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});