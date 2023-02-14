require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    localhost: {
      gas: 12000000,
      allowUnlimitedContractSize: true,
      url: "http://localhost:8545",
    },
    goerli: {
      url: `https://goerli.infura.io/v3/31c3397beb4146e4acc9f4a072da5d23`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    kovan: {
      url: `https://kovan.infura.io/v3/31c3397beb4146e4acc9f4a072da5d23`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      gasPrice: 5000000000,
      timeout: 100000
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/31c3397beb4146e4acc9f4a072da5d23`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    bsc_testnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    bsc_mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    mainnet: {
      url: `https://mainet.infura.io/v3/31c3397beb4146e4acc9f4a072da5d23`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    apothem: {
      url: `https://erpc.apothem.network`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    xdc: {
      url: `https://rpc.xdc.network`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
    ],
  }
};
