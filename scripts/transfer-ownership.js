const { ethers } = require("hardhat");

async function main() {
    // Addresses
    const FACTORY_ADDRESS = '0xCf39Af8765284b33e269886106b91553D8a87e0C'
    const NEW_OWNER_ADDRESS = '0xc0Ee98ac1a44B56fbe2669A3B3C006DEB6fDd0f9'

    // Get the factory
    const Factory = await ethers.getContractFactory("UniswapV2Factory")
    const factory = await Factory.attach(FACTORY_ADDRESS)

    // Set the owner (owner has permission to set fee receipient address)
    const feeToSetterTxn = await factory.setFeeToSetter(NEW_OWNER_ADDRESS)

    // Wait until the transaction is mined
    console.log("Waiting for block to be mined...")
    await feeToSetterTxn.wait();
    
    // Print the owner address
    const feeToSetter = await factory.feeToSetter();
    console.log("New owner address: ", feeToSetter)
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});