// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TodoList
 * @dev A decentralized todo list application
 * @notice Allows users to create, update, and manage their tasks on-chain
 */
contract TodoList {
    // ============ Structs ============
    struct Task {
        uint256 id;
        string content;
        bool completed;
        uint256 createdAt;
        uint256 completedAt;
    }

    // ============ State Variables ============
    mapping(address => Task[]) private userTasks;
    mapping(address => uint256) public taskCount;

    // ============ Events ============
    event TaskCreated(
        address indexed user,
        uint256 indexed taskId,
        string content,
        uint256 timestamp
    );

    event TaskCompleted(
        address indexed user,
        uint256 indexed taskId,
        uint256 timestamp
    );

    event TaskUncompleted(
        address indexed user,
        uint256 indexed taskId,
        uint256 timestamp
    );

    event TaskUpdated(
        address indexed user,
        uint256 indexed taskId,
        string newContent,
        uint256 timestamp
    );

    event TaskDeleted(
        address indexed user,
        uint256 indexed taskId,
        uint256 timestamp
    );

    // ============ Modifiers ============
    modifier validTaskId(uint256 _taskId) {
        require(_taskId < userTasks[msg.sender].length, "Task does not exist");
        _;
    }

    modifier nonEmptyContent(string memory _content) {
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(bytes(_content).length <= 500, "Content too long (max 500 chars)");
        _;
    }

    // ============ External Functions ============

    /**
     * @dev Creates a new task
     * @param _content The content/description of the task
     */
    function createTask(string memory _content) 
        external 
        nonEmptyContent(_content) 
    {
        uint256 taskId = userTasks[msg.sender].length;
        
        userTasks[msg.sender].push(Task({
            id: taskId,
            content: _content,
            completed: false,
            createdAt: block.timestamp,
            completedAt: 0
        }));
        
        taskCount[msg.sender]++;
        
        emit TaskCreated(msg.sender, taskId, _content, block.timestamp);
    }

    /**
     * @dev Toggles the completion status of a task
     * @param _taskId The ID of the task to toggle
     */
    function toggleTask(uint256 _taskId) 
        external 
        validTaskId(_taskId) 
    {
        Task storage task = userTasks[msg.sender][_taskId];
        task.completed = !task.completed;
        
        if (task.completed) {
            task.completedAt = block.timestamp;
            emit TaskCompleted(msg.sender, _taskId, block.timestamp);
        } else {
            task.completedAt = 0;
            emit TaskUncompleted(msg.sender, _taskId, block.timestamp);
        }
    }

    /**
     * @dev Updates the content of a task
     * @param _taskId The ID of the task to update
     * @param _newContent The new content for the task
     */
    function updateTask(uint256 _taskId, string memory _newContent) 
        external 
        validTaskId(_taskId)
        nonEmptyContent(_newContent)
    {
        userTasks[msg.sender][_taskId].content = _newContent;
        emit TaskUpdated(msg.sender, _taskId, _newContent, block.timestamp);
    }

    /**
     * @dev Deletes a task (marks it by setting content to empty)
     * @param _taskId The ID of the task to delete
     */
    function deleteTask(uint256 _taskId) 
        external 
        validTaskId(_taskId) 
    {
        // Instead of removing, we mark as deleted to maintain IDs
        Task storage task = userTasks[msg.sender][_taskId];
        require(bytes(task.content).length > 0, "Task already deleted");
        
        task.content = "";
        task.completed = true;
        taskCount[msg.sender]--;
        
        emit TaskDeleted(msg.sender, _taskId, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @dev Gets a specific task by ID
     * @param _taskId The ID of the task
     * @return The task struct
     */
    function getTask(uint256 _taskId) 
        external 
        view 
        validTaskId(_taskId) 
        returns (Task memory) 
    {
        return userTasks[msg.sender][_taskId];
    }

    /**
     * @dev Gets all tasks for the caller
     * @return An array of all tasks
     */
    function getAllTasks() external view returns (Task[] memory) {
        return userTasks[msg.sender];
    }

    /**
     * @dev Gets the count of active (non-deleted) tasks
     * @return The number of active tasks
     */
    function getActiveTaskCount() external view returns (uint256) {
        return taskCount[msg.sender];
    }

    /**
     * @dev Gets only completed tasks
     * @return An array of completed tasks
     */
    function getCompletedTasks() external view returns (Task[] memory) {
        Task[] memory allTasks = userTasks[msg.sender];
        uint256 completedCount = 0;
        
        // Count completed tasks (excluding deleted ones)
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (allTasks[i].completed && bytes(allTasks[i].content).length > 0) {
                completedCount++;
            }
        }
        
        // Create array of completed tasks
        Task[] memory completedTasks = new Task[](completedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (allTasks[i].completed && bytes(allTasks[i].content).length > 0) {
                completedTasks[index] = allTasks[i];
                index++;
            }
        }
        
        return completedTasks;
    }

    /**
     * @dev Gets only pending (incomplete) tasks
     * @return An array of pending tasks
     */
    function getPendingTasks() external view returns (Task[] memory) {
        Task[] memory allTasks = userTasks[msg.sender];
        uint256 pendingCount = 0;
        
        // Count pending tasks
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (!allTasks[i].completed && bytes(allTasks[i].content).length > 0) {
                pendingCount++;
            }
        }
        
        // Create array of pending tasks
        Task[] memory pendingTasks = new Task[](pendingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (!allTasks[i].completed && bytes(allTasks[i].content).length > 0) {
                pendingTasks[index] = allTasks[i];
                index++;
            }
        }
        
        return pendingTasks;
    }

    /**
     * @dev Gets tasks for any address (public view)
     * @param _user The address to query
     * @return The total number of tasks for the user
     */
    function getTaskCountForUser(address _user) external view returns (uint256) {
        return taskCount[_user];
    }
}
