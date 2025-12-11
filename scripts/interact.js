const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;
  
  console.log("═".repeat(60));
  console.log("🧪 ToDo DApp - Contract Interaction Demo");
  console.log("═".repeat(60));
  console.log(`📡 Network: ${networkName}`);
  console.log("─".repeat(60));

  // Get signer
  const [user] = await hre.ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log(`👤 User: ${userAddress}`);

  // Get contract address from environment or use the latest deployment
  let contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.log("\n⚠️  No CONTRACT_ADDRESS in environment.");
    console.log("   Please deploy first or set CONTRACT_ADDRESS");
    console.log("   Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.js --network <network>");
    return;
  }

  console.log(`📍 Contract: ${contractAddress}`);
  console.log("─".repeat(60));

  // Connect to contract
  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = TodoList.attach(contractAddress);

  // Demo interactions
  console.log("\n🎯 Starting Demo Interactions...\n");

  // 1. Create tasks
  console.log("📝 Creating tasks...");
  
  const tasks = [
    "Learn Solidity basics",
    "Build a ToDo DApp",
    "Deploy to Shardeum testnet",
    "Test all functionalities",
    "Share with the community"
  ];

  for (const task of tasks) {
    const tx = await todoList.createTask(task);
    await tx.wait();
    console.log(`   ✓ Created: "${task}"`);
  }

  // 2. Get all tasks
  console.log("\n📋 Fetching all tasks...");
  let allTasks = await todoList.getAllTasks();
  console.log(`   Total tasks: ${allTasks.length}`);

  // 3. Complete some tasks
  console.log("\n✅ Completing tasks...");
  await (await todoList.toggleTask(0)).wait();
  console.log(`   ✓ Completed task #0`);
  await (await todoList.toggleTask(1)).wait();
  console.log(`   ✓ Completed task #1`);

  // 4. Update a task
  console.log("\n✏️  Updating task...");
  await (await todoList.updateTask(2, "Deploy to Shardeum EVM Testnet (Mezame)")).wait();
  console.log(`   ✓ Updated task #2`);

  // 5. Get task stats
  console.log("\n📊 Task Statistics:");
  const activeCount = await todoList.getActiveTaskCount();
  const completedTasks = await todoList.getCompletedTasks();
  const pendingTasks = await todoList.getPendingTasks();
  
  console.log(`   Active tasks: ${activeCount}`);
  console.log(`   Completed: ${completedTasks.length}`);
  console.log(`   Pending: ${pendingTasks.length}`);

  // 6. Display all tasks
  console.log("\n📜 All Tasks:");
  console.log("─".repeat(50));
  allTasks = await todoList.getAllTasks();
  
  for (const task of allTasks) {
    if (task.content.length > 0) { // Skip deleted tasks
      const status = task.completed ? "✅" : "⬜";
      const date = new Date(Number(task.createdAt) * 1000).toLocaleString();
      console.log(`   ${status} [#${task.id}] ${task.content}`);
      console.log(`      Created: ${date}`);
      if (task.completed && task.completedAt > 0) {
        const completedDate = new Date(Number(task.completedAt) * 1000).toLocaleString();
        console.log(`      Completed: ${completedDate}`);
      }
    }
  }

  // 7. Delete a task demo
  console.log("\n🗑️  Deleting task #4...");
  await (await todoList.deleteTask(4)).wait();
  console.log(`   ✓ Deleted task #4`);

  // Final stats
  console.log("\n" + "═".repeat(60));
  console.log("📊 Final Statistics:");
  console.log("─".repeat(60));
  const finalActive = await todoList.getActiveTaskCount();
  const finalCompleted = await todoList.getCompletedTasks();
  const finalPending = await todoList.getPendingTasks();
  console.log(`   Active tasks: ${finalActive}`);
  console.log(`   Completed: ${finalCompleted.length}`);
  console.log(`   Pending: ${finalPending.length}`);
  console.log("═".repeat(60));
  console.log("✨ Demo Complete!");
  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error during interaction!");
    console.error(error);
    process.exit(1);
  });
