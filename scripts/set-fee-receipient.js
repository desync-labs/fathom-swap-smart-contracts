const { ethers } = require("hardhat");

async function main() {
    // Addresses
    const FACTORY_ADDRESS = '0xCf39Af8765284b33e269886106b91553D8a87e0C'
    const FEE_TO_ADDRESS = '0x69b9D469cdc6e0efDEe4027BaD6A5d8415DEde6B'

    // Get the factory
    const Factory = await ethers.getContractFactory("UniswapV2Factory")
    const factory = await Factory.attach(FACTORY_ADDRESS)

    // Set receipient of fees
    const feeToTxn = await factory.setFeeTo(FEE_TO_ADDRESS)

    // Wait until the transaction is mined
    console.log("Waiting for block to be mined...")
    await feeToTxn.wait();
    
    // Print the feeTo address
    var feeTo = await factory.feeTo();
    console.log("Fee to address: ", feeTo)
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});