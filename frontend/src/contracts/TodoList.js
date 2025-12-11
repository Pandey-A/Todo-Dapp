// TodoList Contract ABI
// This is the Application Binary Interface for interacting with the smart contract

import TodoListArtifact from './TodoList.json';

export const TODO_LIST_ABI = TodoListArtifact.abi;

// Network configurations
export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH",
    explorer: null,
  },
  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH",
    explorer: null,
  },
  shardeum_testnet: {
    chainId: 8119,
    name: "Shardeum EVM Testnet",
    rpcUrl: "https://api-mezame.shardeum.org",
    currency: "SHM",
    explorer: "https://explorer-mezame.shardeum.org",
    faucet: "https://docs.shardeum.org/docs/developer/faucet",
  },
  shardeum_unstablenet: {
    chainId: 8080,
    name: "Shardeum Unstablenet",
    rpcUrl: "https://api.unstablenet.shardeum.org",
    currency: "SHM",
    explorer: "https://explorer.unstablenet.shardeum.org",
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/",
    currency: "ETH",
    explorer: "https://sepolia.etherscan.io",
  },
};

// Default contract address - UPDATE THIS AFTER DEPLOYMENT
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";
