const hre = require("hardhat");
require("dotenv").config();
const fs = require('fs');
const { parseEther } = require("ethers/lib/utils");


const privateKey1 = process.env.PRIVATE_KEY1;
const url = "http://localhost:8545";
const provider = new hre.ethers.providers.JsonRpcProvider(url);
const walletDeployer = new hre.ethers.Wallet(privateKey1,provider);
const DeployerAddress = walletDeployer.address;

async function main() {
  // Deploy FathomswapFactory
  const FathomswapFactory = await hre.ethers.getContractFactory("FathomswapFactory");
  const fathomswapFactory = await FathomswapFactory.deploy("0x4C5F0f90a2D4b518aFba11E22AC9b8F6B031d204");
  await fathomswapFactory.deployed();
  console.log("FathomswapFactory was deployed to:", fathomswapFactory.address);
  
  // Deploy WETH
  const WETHFactory = await hre.ethers.getContractFactory("WETH9");
  const weth = await WETHFactory.deploy();
  await weth.deployed();
  console.log("WETH token was deployed on address " + weth.address);

  // Deploy Router
  const Router = await hre.ethers.getContractFactory("FathomswapRouter02");
  const router = await Router.deploy(fathomswapFactory.address, weth.address);
  await router.deployed();
  console.log("FathomswapRouter was deployed to:", router.address);
  
  // Deploy mocked BEP20
  const BEP20 = await hre.ethers.getContractFactory("BEP20");
  const WXDC = await BEP20.deploy("WXDC", "WXDC");
  await WXDC.deployed();
  await WXDC.mint(DeployerAddress, parseEther("1000000"))
  
  console.log("WXDC deployed to :", WXDC.address);

  // Deploy mocked USDT
  const USDT = await BEP20.deploy("USDT", "USDT");
  await USDT.deployed();
  await USDT.mint(DeployerAddress, parseEther("1000000"))
  console.log("USDT deployed to :", USDT.address);

  // Deploy mocked USDT
  const ABC = await BEP20.deploy("ABC", "ABC");
  await ABC.deployed();
  await ABC.mint(DeployerAddress, parseEther("1000000"))
  console.log("ABC deployed to :", ABC.address);

  let addresses = { 
    WXDC: WXDC.address,
    USDT: USDT.address,
    ABC: ABC.address,
    WETH: weth.address,
    router: router.address,
    factory: fathomswapFactory.address
  };
  
  let data = JSON.stringify(addresses);
  fs.writeFileSync('./scripts/testScenario/cupcakes/0_deployment.json', data);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
