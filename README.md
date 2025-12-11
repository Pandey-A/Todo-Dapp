# 📝 ToDo DApp

A decentralized ToDo application built with Solidity, Hardhat, and React. Deploy and run on both local Hardhat network and Shardeum EVM Testnet.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19-yellow.svg)

## ✨ Features

- **Full CRUD Operations**: Create, Read, Update, Delete tasks on-chain
- **Task Management**: Toggle completion status, filter by status
- **User Isolation**: Each wallet has its own private task list
- **Event Logging**: All actions emit events for frontend tracking
- **Multi-Network**: Deploy to Hardhat local, Shardeum testnet, or Sepolia
- **Modern UI**: Cyber-punk inspired React frontend

## 🛠️ Tech Stack

- **Smart Contract**: Solidity 0.8.24
- **Development**: Hardhat
- **Frontend**: React 18 + ethers.js v6
- **Networks**: Hardhat Local, Shardeum EVM Testnet (Mezame), Sepolia

## 📋 Prerequisites

- Node.js v18+
- npm or yarn
- MetaMask browser extension

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your private key
```

### 3. Local Development

```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contract
npm run deploy:local

# Terminal 3: Start frontend
npm run frontend:start
```

### 4. Deploy to Shardeum Testnet

```bash
# Get testnet SHM from faucet first:
# https://docs.shardeum.org/docs/developer/faucet

npm run deploy:shardeum
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npm run node` | Start local Hardhat node |
| `npm run deploy:local` | Deploy to local network |
| `npm run deploy:shardeum` | Deploy to Shardeum testnet |
| `npm run frontend:start` | Start React dev server |

## 🌐 Network Configuration

### Hardhat Local
- **Chain ID**: 31337
- **RPC**: http://127.0.0.1:8545
- **Currency**: ETH

### Shardeum EVM Testnet (Mezame)
- **Chain ID**: 8119
- **RPC**: https://api-mezame.shardeum.org
- **Currency**: SHM
- **Explorer**: https://explorer-mezame.shardeum.org
- **Faucet**: https://docs.shardeum.org/docs/developer/faucet

## 📁 Project Structure

```
todo-dapp/
├── contracts/           # Solidity smart contracts
│   └── TodoList.sol
├── scripts/             # Deployment & interaction scripts
│   ├── deploy.js
│   └── interact.js
├── test/                # Contract tests
│   └── TodoList.test.js
├── frontend/            # React application
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── contracts/   # ABI & config
│       └── hooks/       # React hooks
├── hardhat.config.js    # Network configuration
├── .env.example         # Environment template
└── TODO_DAPP_SETUP_GUIDE.docx  # Detailed setup guide
```

## 📖 Smart Contract API

### Write Functions
- `createTask(content)` - Create a new task
- `toggleTask(taskId)` - Toggle completion status
- `updateTask(taskId, newContent)` - Update task content
- `deleteTask(taskId)` - Delete a task

### Read Functions
- `getAllTasks()` - Get all user's tasks
- `getTask(taskId)` - Get specific task
- `getCompletedTasks()` - Get completed tasks
- `getPendingTasks()` - Get pending tasks
- `getActiveTaskCount()` - Get count of active tasks

## 🔧 Troubleshooting

### "Nonce too high" Error
Reset MetaMask: Settings → Advanced → Clear Activity Tab Data

### Transaction Stuck on Shardeum
Shardeum processes in ~60s cycles. Wait for cycle completion.

### Gas Estimation Failed
On Shardeum, manually set gas limit to 3,000,000.

## 📚 Resources

- [Shardeum Documentation](https://docs.shardeum.org)
- [Shardeum Faucet](https://docs.shardeum.org/docs/developer/faucet)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the Shardeum ecosystem**
# Todo-Dapp
