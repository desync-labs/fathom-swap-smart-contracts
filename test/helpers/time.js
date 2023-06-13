const { ethers } = require("hardhat");

async function latest() {
    const block = await ethers.provider.getBlock("latest")
    return ethers.BigNumber.from(block.timestamp)
}

async function latestNumber() {
    const block = await ethers.provider.getBlock("latest")
    return ethers.BigNumber.from(block.number)
}

async function advanceBlock() {
    await ethers.provider.send("evm_mine", [])
}

async function increase(duration) {
    await ethers.provider.send("evm_increaseTime", [Number(duration)])
    await advanceBlock()
}

// async function increase2(integer) {
//     // First we increase the time
//     await web3.currentProvider.send({
//       jsonrpc: '2.0',
//       method: 'evm_increaseTime',
//       params: [Number(integer)],
//       id: 0,
//     }, () => {});
//     // Then we mine a block to actually get the time change to occurs
//     await advanceBlock();
//   } 

module.exports = { latest, advanceBlock, increase, latestNumber}