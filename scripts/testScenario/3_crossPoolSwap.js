const hre = require("hardhat");
require("dotenv").config();
const fs = require('fs');

const { parseEther} = require("ethers/lib/utils");

const privateKey3 = process.env.PRIVATE_KEY3;

const url = "http://localhost:8545";
let provider = new hre.ethers.providers.JsonRpcProvider(url);
const walletBob = new hre.ethers.Wallet(privateKey3,provider);

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
    address : addresses.router
}

async function main() {
    //WXDC attach
    const BEP20 = await hre.ethers.getContractFactory("BEP20");
    const WXDC = BEP20.attach(WXDCJSON.address);
    //ABC attach
    const ABC = BEP20.attach(ABCJSON.address);

    //Mint some stablecoin to Alice
    await WXDC.mint(walletBob.address, parseEther("100"))
    await WXDC.connect(walletBob).approve(routerJSON.address, parseEther("100"));

    console.log("Bob WXDC balance " + await WXDC.balanceOf(walletBob.address));
    console.log("Bob ABC balance " + await ABC.balanceOf(walletBob.address));

    await swapTokens([WXDC.address, USDTJSON.address, ABC.address],100,walletBob);

    console.log("Bob WXDC balance " + await WXDC.balanceOf(walletBob.address));
    console.log("Bob ABC balance " + await ABC.balanceOf(walletBob.address));
}

async function swapTokens(path, amountIn, wallet) {
    try {
        // Router attach
        const Router = await hre.ethers.getContractFactory("FathomswapRouter02");
        const router = Router.attach(routerJSON.address).connect(wallet);
        
        var amounts = await router.getAmountsOut(parseEther(amountIn.toString()), path)
        const amountOutMin = amounts[2].sub(amounts[2].div(10));

        var tx = await router.swapExactTokensForTokens(
            parseEther(amountIn.toString()),
            amountOutMin,
            path,
            wallet.address,
            Date.now() + 1000 * 60 * 3 //10 minutes
          );

          console.log("Swaped");
    } catch(e) {
        console.log(e)
    }
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})