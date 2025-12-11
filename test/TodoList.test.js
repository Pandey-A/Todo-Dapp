const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TodoList", function () {
  // Fixture to deploy contract and get signers
  async function deployTodoListFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const TodoList = await ethers.getContractFactory("TodoList");
    const todoList = await TodoList.deploy();
    
    return { todoList, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      expect(await todoList.getAddress()).to.be.properAddress;
    });

    it("Should start with zero tasks", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      expect(await todoList.getActiveTaskCount()).to.equal(0);
      expect((await todoList.getAllTasks()).length).to.equal(0);
    });
  });

  describe("Task Creation", function () {
    it("Should create a task successfully", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      
      await expect(todoList.createTask("My first task"))
        .to.emit(todoList, "TaskCreated")
        .withArgs(owner.address, 0, "My first task", await time.latest() + 1);
      
      expect(await todoList.getActiveTaskCount()).to.equal(1);
    });

    it("Should create multiple tasks with correct IDs", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Task 1");
      await todoList.createTask("Task 2");
      await todoList.createTask("Task 3");
      
      const tasks = await todoList.getAllTasks();
      expect(tasks.length).to.equal(3);
      expect(tasks[0].id).to.equal(0);
      expect(tasks[1].id).to.equal(1);
      expect(tasks[2].id).to.equal(2);
    });

    it("Should store task content correctly", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      const content = "Learn Solidity";
      
      await todoList.createTask(content);
      const task = await todoList.getTask(0);
      
      expect(task.content).to.equal(content);
      expect(task.completed).to.be.false;
    });

    it("Should reject empty content", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await expect(todoList.createTask(""))
        .to.be.revertedWith("Content cannot be empty");
    });

    it("Should reject content longer than 500 characters", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      const longContent = "a".repeat(501);
      
      await expect(todoList.createTask(longContent))
        .to.be.revertedWith("Content too long (max 500 chars)");
    });

    it("Should allow content of exactly 500 characters", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      const maxContent = "a".repeat(500);
      
      await expect(todoList.createTask(maxContent)).to.not.be.reverted;
    });
  });

  describe("Task Completion Toggle", function () {
    it("Should toggle task to completed", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Test task");
      await expect(todoList.toggleTask(0))
        .to.emit(todoList, "TaskCompleted");
      
      const task = await todoList.getTask(0);
      expect(task.completed).to.be.true;
      expect(task.completedAt).to.be.gt(0);
    });

    it("Should toggle task back to incomplete", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Test task");
      await todoList.toggleTask(0); // Complete
      await expect(todoList.toggleTask(0)) // Uncomplete
        .to.emit(todoList, "TaskUncompleted");
      
      const task = await todoList.getTask(0);
      expect(task.completed).to.be.false;
      expect(task.completedAt).to.equal(0);
    });

    it("Should reject toggle for non-existent task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await expect(todoList.toggleTask(0))
        .to.be.revertedWith("Task does not exist");
    });
  });

  describe("Task Update", function () {
    it("Should update task content", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Original content");
      const newContent = "Updated content";
      
      await expect(todoList.updateTask(0, newContent))
        .to.emit(todoList, "TaskUpdated")
        .withArgs(owner.address, 0, newContent, await time.latest() + 1);
      
      const task = await todoList.getTask(0);
      expect(task.content).to.equal(newContent);
    });

    it("Should reject empty update content", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Original");
      
      await expect(todoList.updateTask(0, ""))
        .to.be.revertedWith("Content cannot be empty");
    });

    it("Should reject update for non-existent task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await expect(todoList.updateTask(99, "New content"))
        .to.be.revertedWith("Task does not exist");
    });
  });

  describe("Task Deletion", function () {
    it("Should delete task", async function () {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Task to delete");
      expect(await todoList.getActiveTaskCount()).to.equal(1);
      
      await expect(todoList.deleteTask(0))
        .to.emit(todoList, "TaskDeleted");
      
      expect(await todoList.getActiveTaskCount()).to.equal(0);
    });

    it("Should not allow deleting already deleted task", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Task");
      await todoList.deleteTask(0);
      
      await expect(todoList.deleteTask(0))
        .to.be.revertedWith("Task already deleted");
    });
  });

  describe("Task Queries", function () {
    async function createTasksFixture() {
      const { todoList, owner, user1, user2 } = await loadFixture(deployTodoListFixture);
      
      // Create 5 tasks
      await todoList.createTask("Task 1 - Pending");
      await todoList.createTask("Task 2 - Will complete");
      await todoList.createTask("Task 3 - Will complete");
      await todoList.createTask("Task 4 - Pending");
      await todoList.createTask("Task 5 - Will delete");
      
      // Complete tasks 1 and 2 (indices)
      await todoList.toggleTask(1);
      await todoList.toggleTask(2);
      
      // Delete task 4 (index)
      await todoList.deleteTask(4);
      
      return { todoList, owner, user1, user2 };
    }

    it("Should return all tasks", async function () {
      const { todoList } = await loadFixture(createTasksFixture);
      
      const tasks = await todoList.getAllTasks();
      expect(tasks.length).to.equal(5);
    });

    it("Should return completed tasks only", async function () {
      const { todoList } = await loadFixture(createTasksFixture);
      
      const completed = await todoList.getCompletedTasks();
      expect(completed.length).to.equal(2);
      expect(completed[0].content).to.equal("Task 2 - Will complete");
      expect(completed[1].content).to.equal("Task 3 - Will complete");
    });

    it("Should return pending tasks only", async function () {
      const { todoList } = await loadFixture(createTasksFixture);
      
      const pending = await todoList.getPendingTasks();
      expect(pending.length).to.equal(2);
      expect(pending[0].content).to.equal("Task 1 - Pending");
      expect(pending[1].content).to.equal("Task 4 - Pending");
    });

    it("Should return correct active count", async function () {
      const { todoList } = await loadFixture(createTasksFixture);
      
      // Started with 5, deleted 1
      expect(await todoList.getActiveTaskCount()).to.equal(4);
    });
  });

  describe("User Isolation", function () {
    it("Should keep tasks separate between users", async function () {
      const { todoList, owner, user1, user2 } = await loadFixture(deployTodoListFixture);
      
      // Owner creates tasks
      await todoList.connect(owner).createTask("Owner task 1");
      await todoList.connect(owner).createTask("Owner task 2");
      
      // User1 creates tasks
      await todoList.connect(user1).createTask("User1 task 1");
      
      // User2 creates tasks
      await todoList.connect(user2).createTask("User2 task 1");
      await todoList.connect(user2).createTask("User2 task 2");
      await todoList.connect(user2).createTask("User2 task 3");
      
      // Verify isolation
      expect((await todoList.connect(owner).getAllTasks()).length).to.equal(2);
      expect((await todoList.connect(user1).getAllTasks()).length).to.equal(1);
      expect((await todoList.connect(user2).getAllTasks()).length).to.equal(3);
    });

    it("Should return correct task count for any user", async function () {
      const { todoList, owner, user1 } = await loadFixture(deployTodoListFixture);
      
      await todoList.connect(owner).createTask("Owner task");
      await todoList.connect(user1).createTask("User1 task");
      
      expect(await todoList.getTaskCountForUser(owner.address)).to.equal(1);
      expect(await todoList.getTaskCountForUser(user1.address)).to.equal(1);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should track gas for task creation", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      const tx = await todoList.createTask("Test task for gas measurement");
      const receipt = await tx.wait();
      
      console.log(`      Gas used for createTask: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000); // Should be under 200k gas
    });

    it("Should track gas for task toggle", async function () {
      const { todoList } = await loadFixture(deployTodoListFixture);
      
      await todoList.createTask("Test task");
      const tx = await todoList.toggleTask(0);
      const receipt = await tx.wait();
      
      console.log(`      Gas used for toggleTask: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(100000); // Should be under 100k gas
    });
  });
});
