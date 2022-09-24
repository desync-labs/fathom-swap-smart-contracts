const { ethers } = require("hardhat");

async function deploy(contractName, signer, ...args) {
    const Factory = await ethers.getContractFactory(contractName, signer)
    const instance = await Factory.deploy(...args)
    return instance.deployed()
}

async function main() {
    let admin;

    let fathomswapFactory;
    let WETH;
    let router;

    [admin] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", admin.address);
    console.log("Account balance:", (await admin.getBalance()).toString());

    fathomswapFactory = await deploy("UniswapV2Factory", admin, admin.address);
    console.log("FathomswapFactory was deployed on address " + fathomswapFactory.address);

    WETH = await deploy("WETH9", admin);
    console.log("WETH token was deployed on address " + WETH.address);

    router = await deploy("UniswapV2Router02", admin, fathomswapFactory.address, WETH.address);
    console.log("FathomswapRouter was deployed on address " + router.address);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});