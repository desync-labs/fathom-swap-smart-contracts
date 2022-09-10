const hre = require("hardhat");
require("dotenv").config();
const fs = require('fs');

const { parseEther} = require("ethers/lib/utils");

const privateKey2 = process.env.PRIVATE_KEY2;

const url = "http://localhost:8545";
let provider = new hre.ethers.providers.JsonRpcProvider(url);
const walletAlice = new hre.ethers.Wallet(privateKey2,provider);

let rawdata = fs.readFileSync('./scripts/testScenario/cupcakes/0_deployment.json');
let addresses = JSON.parse(rawdata);

const WXDCJSON = {
  address : addresses.WXDC
}

const USDTJSON = {
    address : addresses.USDT
}
const routerJSON = {
    address : addresses.router
}
const factoryJSON = {
    address: addresses.factory
}

async function main() {
    //WXDC attach
    const BEP20 = await hre.ethers.getContractFactory("BEP20");
    const WXDC = BEP20.attach(WXDCJSON.address);
    //USDT attach
    const USDT = BEP20.attach(USDTJSON.address);

    const Factory = await hre.ethers.getContractFactory("FathomswapFactory");
    const factory = Factory.attach(factoryJSON.address);

    const pairAddress = await factory.getPair(WXDC.address,USDT.address);
    const Pair = await hre.ethers.getContractFactory("FathomswapPair");
    const pair = Pair.attach(pairAddress);

    await printPrice(pair);

    //Mint some WXDC to Alice
    await WXDC.mint(walletAlice.address, parseEther("4000"))
    await WXDC.connect(walletAlice).approve(routerJSON.address, parseEther("4000"));

    await swapTokens(WXDC.address, USDT.address,4000,walletAlice);
    console.log("Significant amount of WXDC was swaped");

    await printPrice(pair);
}

async function printPrice(pair) {
    const reserves = await pair.getReserves();
    const price = reserves[0]/ (reserves[1]);
    console.log(`price : ${price}`);
}

async function swapTokens(tokenIn, tokenOut, amountIn, wallet) {
    // Router attach
    const Router = await hre.ethers.getContractFactory("FathomswapRouter02");
    const router = Router.attach(routerJSON.address).connect(wallet);

    var amounts = await router.getAmountsOut(parseEther(amountIn.toString()), [tokenIn, tokenOut])
    const amountOutMin = amounts[1].sub(amounts[1].div(5));

    var tx = await router.swapExactTokensForTokens(
        parseEther(amountIn.toString()),
        amountOutMin,
        [tokenIn, tokenOut],
        wallet.address,
        Date.now() + 1000 * 60 * 3 //10 minutes
        );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})