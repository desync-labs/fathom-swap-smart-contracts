const hre = require("hardhat");
require("dotenv").config();
const fs = require('fs');

const { parseEther} = require("ethers/lib/utils");

const privateKey1 = process.env.PRIVATE_KEY1;

const url = "http://localhost:8545";
let provider = new hre.ethers.providers.JsonRpcProvider(url);
const walletDeployer = new hre.ethers.Wallet(privateKey1,provider);

let rawdata = fs.readFileSync('./scripts/testScenario/cupcakes/0_deployment.json');
let addresses = JSON.parse(rawdata);

const WXDCJSON = {
  address : addresses.WXDC
}

const USDTJSON = {
    address : addresses.USDT
}

const ABCJSON = {
  address : addresses.ABC
}

const routerJSON = {
    address: addresses.router
}

const factoryJSON = {
    address: addresses.factory
}

async function main() {
    // Router attach
    const Router = await hre.ethers.getContractFactory("FathomswapRouter02");
    const router = Router.attach(routerJSON.address);
 
    // Factory attach
    const Factory = await hre.ethers.getContractFactory("FathomswapFactory");
    const factory = Factory.attach(factoryJSON.address);

    //WXDC attach
    const BEP20 = await hre.ethers.getContractFactory("BEP20");
    const WXDC = BEP20.attach(
        WXDCJSON.address // The deployed contract address
    )

    //USDT attach
    const USDT = await BEP20.attach(
        USDTJSON.address // The deployed contract address
    )

    //ABC attach
    const ABC = await BEP20.attach(
        ABCJSON.address // The deployed contract address
    )

    await WXDC.approve(routerJSON.address, parseEther("10000"));
    await USDT.approve(routerJSON.address, parseEther("70000"));
    await ABC.approve(routerJSON.address, parseEther("10000"));

    await addLiquidity(WXDC.address,USDT.address,"WXDC","USDT",10000,20000,walletDeployer, router, factory)
    await addLiquidity(ABC.address,USDT.address,"ABC","USDT",10000,40000,walletDeployer, router, factory)
}

async function addLiquidity(token1Address, token2Address, token1Symbol, token2Symbol, token1Amount, token2Amount, tokwnOwner, router, factory) {
    console.log(`Adding Liquidity for Pair ${token1Symbol}-${token2Symbol}`)

    await router.addLiquidity(token1Address, 
        token2Address, 
        parseEther(token1Amount.toString()), 
        parseEther(token2Amount.toString()),  
        parseEther(token1Amount.toString()),  
        parseEther(token2Amount.toString()),  
        tokwnOwner.address, 
        await getDeadlineTimestamp(10000)
    );

    let pairAddress  = await factory.getPair(token1Address,token2Address) 
    const BEP20 = await hre.ethers.getContractFactory("BEP20");
    const pairAsToken = BEP20.attach(pairAddress)

    console.log(`${token1Symbol}-${token2Symbol} Pair Added to Liquidity Pool at Address ${pairAddress}`)
    console.log(`Balance of LP token for pair ${token1Symbol}-${token2Symbol} is ${await pairAsToken.balanceOf(tokwnOwner.address)}`)
}

async function getDeadlineTimestamp(deadline) {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp + deadline;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})