import React, { useState, useEffect } from 'react';
import { useWallet, useTodoContract } from './hooks/useWallet';
import { NETWORKS, CONTRACT_ADDRESS } from './contracts/TodoList';
import './App.css';

function App() {
  const {
    account,
    balance,
    network,
    chainId,
    isConnecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnected,
    signer,
  } = useWallet();

  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [editingTask, setEditingTask] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [txPending, setTxPending] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  const {
    tasks,
    loading: tasksLoading,
    error: contractError,
    createTask,
    toggleTask,
    updateTask,
    deleteTask,
    fetchTasks,
  } = useTodoContract(signer, contractAddress, chainId);

  // Handle transaction with status updates
  const handleTransaction = async (action, description) => {
    setTxPending(true);
    setTxStatus({ type: 'pending', message: `${description}...` });
    
    try {
      await action();
      setTxStatus({ type: 'success', message: `${description} successful!` });
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setTxStatus({ 
        type: 'error', 
        message: err.reason || err.message || 'Transaction failed' 
      });
      setTimeout(() => setTxStatus(null), 5000);
    } finally {
      setTxPending(false);
    }
  };

  // Create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || txPending) return;
    
    await handleTransaction(
      () => createTask(newTask.trim()),
      'Creating task'
    );
    setNewTask('');
  };

  // Toggle task completion
  const handleToggle = async (taskId) => {
    if (txPending) return;
    await handleTransaction(
      () => toggleTask(taskId),
      'Updating task'
    );
  };

  // Start editing task
  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditContent(task.content);
  };

  // Save edited task
  const handleSaveEdit = async (taskId) => {
    if (!editContent.trim() || txPending) return;
    
    await handleTransaction(
      () => updateTask(taskId, editContent.trim()),
      'Updating task'
    );
    setEditingTask(null);
    setEditContent('');
  };

  // Delete task
  const handleDelete = async (taskId) => {
    if (txPending) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    await handleTransaction(
      () => deleteTask(taskId),
      'Deleting task'
    );
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  // Stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Truncate address
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="app">
      {/* Background Effects */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-icon">◈</span>
            ToDo<span className="logo-accent">Chain</span>
          </h1>
          {network && (
            <div className="network-badge">
              <span className="network-dot"></span>
              {network.name}
            </div>
          )}
        </div>
        
        <div className="header-right">
          {isConnected ? (
            <div className="wallet-info">
              <div className="balance">
                {parseFloat(balance).toFixed(4)} {network?.currency || 'ETH'}
              </div>
              <button className="wallet-button connected" onClick={disconnectWallet}>
                {truncateAddress(account)}
              </button>
            </div>
          ) : (
            <button 
              className="wallet-button"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {/* Wallet Error */}
        {walletError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            {walletError}
          </div>
        )}

        {/* Not Connected State */}
        {!isConnected && (
          <div className="connect-prompt">
            <div className="connect-card">
              <div className="connect-icon">🔗</div>
              <h2>Connect Your Wallet</h2>
              <p>Connect your wallet to start managing your tasks on the blockchain.</p>
              
              <button 
                className="connect-button"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>

              <div className="network-options">
                <p>Supported Networks:</p>
                <div className="network-list">
                  <span className="network-tag">Hardhat Local</span>
                  <span className="network-tag shardeum">Shardeum Testnet</span>
                  <span className="network-tag">Sepolia</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connected State */}
        {isConnected && (
          <div className="dashboard">
            {/* Contract Address Input */}
            <div className="contract-section">
              <label className="input-label">Contract Address</label>
              <div className="contract-input-group">
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="contract-input"
                />
                <button 
                  className="refresh-btn"
                  onClick={fetchTasks}
                  disabled={!contractAddress}
                >
                  ↻
                </button>
              </div>
              {!contractAddress && (
                <p className="hint">
                  Deploy the contract and enter its address above to start.
                </p>
              )}
            </div>

            {/* Network Switcher */}
            <div className="network-switcher">
              <span className="switcher-label">Switch Network:</span>
              <div className="network-buttons">
                <button 
                  className={`net-btn ${network?.chainId === 31337 ? 'active' : ''}`}
                  onClick={() => switchNetwork('localhost')}
                >
                  Local
                </button>
                <button 
                  className={`net-btn shardeum ${network?.chainId === 8119 ? 'active' : ''}`}
                  onClick={() => switchNetwork('shardeum_testnet')}
                >
                  Shardeum
                </button>
                <button 
                  className={`net-btn ${network?.chainId === 11155111 ? 'active' : ''}`}
                  onClick={() => switchNetwork('sepolia')}
                >
                  Sepolia
                </button>
              </div>
            </div>

            {contractAddress && (
              <>
                {/* Stats */}
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Tasks</div>
                  </div>
                  <div className="stat-card completed">
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                  <div className="stat-card pending">
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>

                {/* Transaction Status */}
                {txStatus && (
                  <div className={`tx-status ${txStatus.type}`}>
                    {txStatus.type === 'pending' && <span className="spinner"></span>}
                    {txStatus.type === 'success' && <span>✓</span>}
                    {txStatus.type === 'error' && <span>✗</span>}
                    {txStatus.message}
                  </div>
                )}

                {/* New Task Form */}
                <form className="task-form" onSubmit={handleCreateTask}>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What needs to be done?"
                    className="task-input"
                    maxLength={500}
                    disabled={txPending}
                  />
                  <button 
                    type="submit" 
                    className="add-btn"
                    disabled={!newTask.trim() || txPending}
                  >
                    Add Task
                  </button>
                </form>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                  <button 
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({stats.total})
                  </button>
                  <button 
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                  >
                    Pending ({stats.pending})
                  </button>
                  <button 
                    className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                  >
                    Completed ({stats.completed})
                  </button>
                </div>

                {/* Task List */}
                <div className="task-list">
                  {tasksLoading ? (
                    <div className="loading">
                      <span className="spinner large"></span>
                      <p>Loading tasks...</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <p>No tasks yet. Create one above!</p>
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`task-card ${task.completed ? 'completed' : ''}`}
                      >
                        {editingTask === task.id ? (
                          <div className="edit-mode">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="edit-input"
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button 
                                className="save-btn"
                                onClick={() => handleSaveEdit(task.id)}
                                disabled={txPending}
                              >
                                Save
                              </button>
                              <button 
                                className="cancel-btn"
                                onClick={() => setEditingTask(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="task-main">
                              <button
                                className={`checkbox ${task.completed ? 'checked' : ''}`}
                                onClick={() => handleToggle(task.id)}
                                disabled={txPending}
                              >
                                {task.completed && '✓'}
                              </button>
                              <div className="task-content">
                                <p className="task-text">{task.content}</p>
                                <span className="task-date">
                                  Created: {formatDate(task.createdAt)}
                                  {task.completed && task.completedAt > 0 && (
                                    <> · Completed: {formatDate(task.completedAt)}</>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="task-actions">
                              <button 
                                className="action-btn edit"
                                onClick={() => startEdit(task)}
                                disabled={txPending}
                                title="Edit"
                              >
                                ✎
                              </button>
                              <button 
                                className="action-btn delete"
                                onClick={() => handleDelete(task.id)}
                                disabled={txPending}
                                title="Delete"
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built for <a href="https://shardeum.org" target="_blank" rel="noopener noreferrer">Shardeum</a> 
          {' '}& Hardhat · 
          {network?.explorer && contractAddress && (
            <a 
              href={`${network.explorer}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Contract ↗
            </a>
          )}
        </p>
      </footer>
    </div>
  );
}

export default App;
