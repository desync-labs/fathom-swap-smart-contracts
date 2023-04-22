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
    apothem: {
      url: `https://erpc.apothem.network`,
      accounts: [fs.readFileSync("./privateKey").toString()],
      timeout: 100000
    },
    xinfin: {
      url: `https://erpc.xinfin.network`,
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
      {
        version: "0.8.17",
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
