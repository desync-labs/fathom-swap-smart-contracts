# FathomSwap Smart Contracts

## Setup

```bash
# Install Node.js & npm

# Install local node dependencies:
$ npm install

# Set private key:
$ echo -n "YOUR_PRIVATE_KEY" > privateKey

# Compile contracts
$ npx hardhat compile

# Run tests:
$ npm run test

# Deploy to $network
$ npx hardhat run scripts/deploy.js --network $network

# Set fee receipient 
$ npx hardhat run scripts/set-fee-receipient.js --network $network

# Set ownership (address that has permission to set fee receipient)
$ npx hardhat run scripts/transfer-ownership.js --network $network

# Deploy multicall (only 1 instance needed on network)
$ npx hardhat run scripts/deploy-multicall.js --network $network
```