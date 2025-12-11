require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  
  networks: {
    // Local Hardhat Network (default)
    hardhat: {
      chainId: 31337,
    },
    
    // Localhost (when running `npx hardhat node`)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    // Shardeum EVM Testnet (Mezame)
    shardeum_testnet: {
      url: process.env.SHARDEUM_TESTNET_RPC || "https://api-mezame.shardeum.org",
      chainId: 8119,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000, // 10 gwei - Shardeum has low fees
      timeout: 120000, // 2 minutes timeout for Shardeum's cycle-based processing
    },
    
    // Shardeum Unstablenet (for additional testing)
    shardeum_unstablenet: {
      url: process.env.SHARDEUM_UNSTABLENET_RPC || "https://api.unstablenet.shardeum.org",
      chainId: 8080,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000,
      timeout: 120000,
    },
    
    // Sepolia Testnet (Ethereum)
    sepolia: {
      url: process.env.SEPOLIA_RPC || `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    
    // Berachain bArtio Testnet
    berachain_testnet: {
      url: process.env.BERACHAIN_RPC || "https://bartio.rpc.berachain.com/",
      chainId: 80084,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000000, // 10,000 gwei - Berachain requires higher gas
      timeout: 120000,
    },
  },
  
  // Gas Reporter Configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  
  // Etherscan Configuration (for contract verification)
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  
  // Paths Configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  // Mocha Configuration
  mocha: {
    timeout: 60000, // 60 seconds timeout for tests
  },
};
