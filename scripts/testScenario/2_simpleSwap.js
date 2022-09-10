
const hre = require("hardhat");
require("dotenv").config();
const fs = require('fs');

const { parseEther} = require("ethers/lib/utils");

const privateKey2 = process.env.PRIVATE_KEY2;
const privateKey1 = process.env.PRIVATE_KEY1;


const url = "http://localhost:8545";
let provider = new hre.ethers.providers.JsonRpcProvider(url);
const walletAlice = new hre.ethers.Wallet(privateKey2,provider);
const walletDeployer = new hre.ethers.Wallet(privateKey1,provider);

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

async function main() {
    //WXDC attach
    const BEP20 = await hre.ethers.getContractFactory("BEP20");
    const WXDC = BEP20.attach(WXDCJSON.address);
    //USDT attach
    const USDT = BEP20.attach(USDTJSON.address);

    //Mint some stablecoin to Alice
    await WXDC.mint(walletAlice.address, parseEther("10000"))
    await WXDC.connect(walletAlice).approve(routerJSON.address, parseEther("10000"));

    console.log("Alice USDT balance " + await USDT.balanceOf(walletAlice.address));
    console.log("Alice WXDC balance " + await WXDC.balanceOf(walletAlice.address));

    await swapTokens(WXDC.address,USDT.address,10000,walletAlice);

    console.log("Alice USDT balance " + await USDT.balanceOf(walletAlice.address));
    console.log("Alice WXDC balance " + await WXDC.balanceOf(walletAlice.address));
}

async function swapTokens(tokenIn, tokenOut, amountIn, wallet) {
    // Router attach
    const Router = await hre.ethers.getContractFactory("FathomswapRouter02");
    const router = Router.attach(routerJSON.address).connect(wallet);

    var amounts = await router.getAmountsOut(parseEther(amountIn.toString()), [tokenIn, tokenOut])
    const amountOutMin = amounts[1].sub(amounts[1].div(10));

    await router.swapExactTokensForTokens(
        parseEther(amountIn.toString()),
        amountOutMin,
        [tokenIn, tokenOut],
        wallet.address,
        Date.now() + 1000 * 60 * 3 //10 minutes
        );

    console.log("Swaped");
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})