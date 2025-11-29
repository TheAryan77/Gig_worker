import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  balance: string | null;
  isMetaMaskInstalled: boolean;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    isMetaMaskInstalled: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      const isInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
      setWallet((prev) => ({ ...prev, isMetaMaskInstalled: isInstalled }));
    };

    checkMetaMask();
  }, []);

  // Get balance for an address
  const getBalance = useCallback(async (address: string): Promise<string> => {
    if (!window.ethereum) return "0";
    
    try {
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      // Convert from wei to ETH
      const ethBalance = parseInt(balance as string, 16) / 1e18;
      return ethBalance.toFixed(4);
    } catch {
      return "0";
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts.length > 0) {
        const address = accounts[0];
        
        // Get chain ID
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        }) as string;

        // Get balance
        const balance = await getBalance(address);

        setWallet({
          isConnected: true,
          address,
          chainId,
          balance,
          isMetaMaskInstalled: true,
        });
      }
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      if (error.code === 4001) {
        setError("Connection rejected. Please approve the connection in MetaMask.");
      } else {
        setError(error.message || "Failed to connect wallet");
      }
    } finally {
      setLoading(false);
    }
  }, [getBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWallet((prev) => ({
      ...prev,
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
    }));
  }, []);

  // Switch to a specific network
  const switchNetwork = useCallback(async (chainId: string) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (err: unknown) {
      const error = err as { code?: number };
      // Chain not added to MetaMask
      if (error.code === 4902) {
        setError("This network is not added to MetaMask. Please add it manually.");
      }
    }
  }, []);

  // Add local network to MetaMask
  const addLocalNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x539", // 1337 in hex (common for local blockchains)
            chainName: "Localhost 8545",
            nativeCurrency: {
              name: "Ethereum",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["http://127.0.0.1:8545"],
          },
        ],
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Failed to add network");
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnectWallet();
      } else if (accountsArray[0] !== wallet.address) {
        const balance = await getBalance(accountsArray[0]);
        setWallet((prev) => ({
          ...prev,
          address: accountsArray[0],
          balance,
        }));
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      setWallet((prev) => ({
        ...prev,
        chainId: chainId as string,
      }));
      // Optionally refresh balance on chain change
      if (wallet.address) {
        getBalance(wallet.address).then((balance) => {
          setWallet((prev) => ({ ...prev, balance }));
        });
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [wallet.address, disconnectWallet, getBalance]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        }) as string[];

        if (accounts.length > 0) {
          const address = accounts[0];
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          }) as string;
          const balance = await getBalance(address);

          setWallet({
            isConnected: true,
            address,
            chainId,
            balance,
            isMetaMaskInstalled: true,
          });
        }
      } catch {
        // Silent fail on initial check
      }
    };

    checkConnection();
  }, [getBalance]);

  return {
    wallet,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    addLocalNetwork,
    clearError: () => setError(null),
  };
}

// Helper function to format address
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper function to get network name
export function getNetworkName(chainId: string | null): string {
  const networks: Record<string, string> = {
    "0x1": "Ethereum Mainnet",
    "0x5": "Goerli Testnet",
    "0xaa36a7": "Sepolia Testnet",
    "0x89": "Polygon Mainnet",
    "0x13881": "Polygon Mumbai",
    "0x539": "Localhost 8545",
    "0x7a69": "Hardhat Local",
  };

  return networks[chainId || ""] || `Chain ${chainId}`;
}
