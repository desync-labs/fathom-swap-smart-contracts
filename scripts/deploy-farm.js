const { ethers , upgrades} = require("hardhat");

const rewardAddress = '0x0000000000000000000000000000000000000000';
const rewardPerBLock = '0';

async function main() {
    let admin;

    [admin] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", admin.address);
    console.log("Account balance:", (await admin.getBalance()).toString());

    const Farm = await ethers.getContractFactory("Farm", admin);
    const farm = await upgrades.deployProxy(Farm, [rewardAddress, rewardPerBLock]);
    await farm.deployed();

    console.log("Farm address: " + farm.address);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});