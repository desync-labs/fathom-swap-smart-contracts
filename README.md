# FathomSwap Smart Contracts

## Setup

```bash
# Install Node.js & npm

# Install local node dependencies:
$ npm install

# Set private key:
$ echo -n "YOUR_PRIVATE_KEY" > privateKey

# Compile contracts: 
$ npmx hardhat compile

# Run tests:
$ npm run test

# Deploy to $network (goerli/kovan/ropsten/bsc_testnet)
$ npx hardhat run scripts/deploy.js  --network $network
```