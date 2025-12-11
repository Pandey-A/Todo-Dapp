import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { TODO_LIST_ABI, NETWORKS } from '../contracts/TodoList';

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Get network info from chain ID
  const getNetworkInfo = useCallback((id) => {
    const chainIdNum = typeof id === 'string' ? parseInt(id, 16) : Number(id);
    return Object.values(NETWORKS).find(n => n.chainId === chainIdNum) || {
      name: `Unknown (${chainIdNum})`,
      currency: 'ETH',
      chainId: chainIdNum,
    };
  }, []);

  // Update balance
  const updateBalance = useCallback(async (providerInstance, addr) => {
    if (!providerInstance || !addr) return;
    try {
      const bal = await providerInstance.getBalance(addr);
      setBalance(formatEther(bal));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to use this app');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const signerInstance = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      
      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setNetwork(getNetworkInfo(network.chainId));
      await updateBalance(browserProvider, accounts[0]);
      
      return true;
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [getNetworkInfo, updateBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setNetwork(null);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetNetwork) => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return false;
    }

    const networkConfig = NETWORKS[targetNetwork];
    if (!networkConfig) {
      setError('Unknown network');
      return false;
    }

    const chainIdHex = `0x${networkConfig.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // Network not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: networkConfig.name,
              nativeCurrency: {
                name: networkConfig.currency,
                symbol: networkConfig.currency,
                decimals: 18,
              },
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: networkConfig.explorer ? [networkConfig.explorer] : null,
            }],
          });
          return true;
        } catch (addError) {
          setError('Failed to add network');
          return false;
        }
      }
      setError('Failed to switch network');
      return false;
    }
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (provider) {
          await updateBalance(provider, accounts[0]);
        }
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      setNetwork(getNetworkInfo(newChainId));
      // Reload to reset state
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, provider, disconnectWallet, getNetworkInfo, updateBalance]);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Auto-connect error:', err);
        }
      }
    };
    checkConnection();
  }, [connectWallet]);

  return {
    provider,
    signer,
    account,
    balance,
    chainId,
    network,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnected: !!account,
  };
}

export function useTodoContract(signer, contractAddress, chainId) {
  const [contract, setContract] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get gas options based on network
  // This fixes MetaMask gas estimation issues on local networks and Shardeum
  const getGasOptions = useCallback(() => {
    // Shardeum networks need higher gas limit due to their gas model
    if (chainId === 8119 || chainId === 8080) {
      return { gasLimit: 3000000 };
    }
    // Hardhat local network
    if (chainId === 31337) {
      return { gasLimit: 500000 };
    }
    // Other networks - let MetaMask estimate
    return {};
  }, [chainId]);

  // Initialize contract
  useEffect(() => {
    if (signer && contractAddress) {
      try {
        const contractInstance = new Contract(contractAddress, TODO_LIST_ABI, signer);
        setContract(contractInstance);
      } catch (err) {
        setError('Failed to initialize contract');
      }
    } else {
      setContract(null);
    }
  }, [signer, contractAddress]);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!contract) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const allTasks = await contract.getAllTasks();
      const formattedTasks = allTasks
        .map((task, index) => ({
          id: Number(task.id),
          content: task.content,
          completed: task.completed,
          createdAt: Number(task.createdAt),
          completedAt: Number(task.completedAt),
        }))
        .filter(task => task.content.length > 0); // Filter deleted tasks
      
      setTasks(formattedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Create task
  const createTask = useCallback(async (content) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const gasOptions = getGasOptions();
    const tx = await contract.createTask(content, gasOptions);
    await tx.wait();
    await fetchTasks();
    return tx;
  }, [contract, fetchTasks, getGasOptions]);

  // Toggle task
  const toggleTask = useCallback(async (taskId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const gasOptions = getGasOptions();
    const tx = await contract.toggleTask(taskId, gasOptions);
    await tx.wait();
    await fetchTasks();
    return tx;
  }, [contract, fetchTasks, getGasOptions]);

  // Update task
  const updateTask = useCallback(async (taskId, newContent) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const gasOptions = getGasOptions();
    const tx = await contract.updateTask(taskId, newContent, gasOptions);
    await tx.wait();
    await fetchTasks();
    return tx;
  }, [contract, fetchTasks, getGasOptions]);

  // Delete task
  const deleteTask = useCallback(async (taskId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const gasOptions = getGasOptions();
    const tx = await contract.deleteTask(taskId, gasOptions);
    await tx.wait();
    await fetchTasks();
    return tx;
  }, [contract, fetchTasks, getGasOptions]);

  // Fetch tasks when contract changes
  useEffect(() => {
    if (contract) {
      fetchTasks();
    }
  }, [contract, fetchTasks]);

  return {
    contract,
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    toggleTask,
    updateTask,
    deleteTask,
  };
}
