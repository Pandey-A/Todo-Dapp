const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;
  
  console.log("═".repeat(60));
  console.log("🚀 ToDo DApp - Smart Contract Deployment");
  console.log("═".repeat(60));
  console.log(`📡 Network: ${networkName}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log("─".repeat(60));

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`👤 Deployer: ${deployerAddress}`);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  const formattedBalance = hre.ethers.formatEther(balance);
  console.log(`💰 Balance: ${formattedBalance} ${getNetworkCurrency(networkName)}`);
  console.log("─".repeat(60));

  // Check minimum balance
  if (balance < hre.ethers.parseEther("0.001")) {
    console.log("⚠️  Warning: Low balance! You may not have enough for deployment.");
    if (networkName === "shardeum_testnet") {
      console.log("   Get testnet SHM from: https://docs.shardeum.org/docs/developer/faucet");
    }
  }

  // Deploy contract
  console.log("\n📦 Deploying TodoList contract...");
  
  const TodoList = await hre.ethers.getContractFactory("TodoList");
  
  // For Shardeum, we might need higher gas limit
  const deployOptions = {};
  if (networkName.includes("shardeum")) {
    deployOptions.gasLimit = 3000000; // 3M gas limit for Shardeum
  }
  
  const todoList = await TodoList.deploy(deployOptions);
  await todoList.waitForDeployment();
  
  const contractAddress = await todoList.getAddress();
  
  console.log("─".repeat(60));
  console.log("✅ Deployment Successful!");
  console.log("─".repeat(60));
  console.log(`📍 Contract Address: ${contractAddress}`);
  
  // Get deployment transaction
  const deployTx = todoList.deploymentTransaction();
  if (deployTx) {
    console.log(`📝 Transaction Hash: ${deployTx.hash}`);
    const receipt = await deployTx.wait();
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`📦 Block Number: ${receipt.blockNumber}`);
  }

  // Network-specific explorer links
  console.log("\n🔗 Explorer Links:");
  const explorerUrl = getExplorerUrl(networkName, contractAddress);
  if (explorerUrl) {
    console.log(`   ${explorerUrl}`);
  }

  // Verification instructions
  console.log("\n" + "─".repeat(60));
  console.log("📋 Next Steps:");
  console.log("─".repeat(60));
  console.log(`1. Update .env file with:`);
  console.log(`   REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   REACT_APP_NETWORK=${networkName}`);
  console.log(`\n2. For frontend:`);
  console.log(`   cd frontend && npm start`);
  
  if (networkName === "sepolia") {
    console.log(`\n3. Verify contract (optional):`);
    console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("═".repeat(60));

  // Return contract info for testing
  return {
    address: contractAddress,
    deployer: deployerAddress,
    network: networkName,
  };
}

function getNetworkCurrency(network) {
  const currencies = {
    hardhat: "ETH",
    localhost: "ETH",
    sepolia: "ETH",
    shardeum_testnet: "SHM",
    shardeum_unstablenet: "SHM",
  };
  return currencies[network] || "ETH";
}

function getExplorerUrl(network, address) {
  const explorers = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    shardeum_testnet: `https://explorer-mezame.shardeum.org/address/${address}`,
    shardeum_unstablenet: `https://explorer.unstablenet.shardeum.org/address/${address}`,
  };
  return explorers[network] || null;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed!");
    console.error(error);
    process.exit(1);
  });
