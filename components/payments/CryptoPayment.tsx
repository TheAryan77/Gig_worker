"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ethers } from "ethers";
import {
  IconWallet,
  IconCurrencyEthereum,
  IconCurrencyBitcoin,
  IconCheck,
  IconLock,
  IconAlertCircle,
  IconExternalLink,
  IconX,
  IconCopy,
  IconRefresh,
} from "@tabler/icons-react";

interface CryptoPaymentProps {
  amount: number; // Amount in USD
  projectTitle: string;
  freelancerName: string;
  freelancerWallet?: string; // Optional: freelancer's wallet address
  onSuccess: (txHash: string, network: string) => void;
  onCancel: () => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

// Get ethereum provider from window
const getEthereum = (): ethers.providers.ExternalProvider | undefined => {
  if (typeof window !== "undefined") {
    return (window as unknown as { ethereum?: ethers.providers.ExternalProvider }).ethereum;
  }
  return undefined;
};

interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

const SUPPORTED_NETWORKS: { [key: string]: NetworkConfig } = {
  ethereum: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  polygon: {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  sepolia: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

// Mock ETH price for conversion (in production, fetch from API)
const ETH_PRICE_USD = 2000;

export default function CryptoPayment({
  amount,
  projectTitle,
  freelancerName,
  freelancerWallet,
  onSuccess,
  onCancel,
  processing,
  setProcessing,
}: CryptoPaymentProps) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<"ethereum" | "polygon" | "sepolia">("sepolia");
  const [balance, setBalance] = useState<string | null>(null);
  const [ethAmount, setEthAmount] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Escrow wallet address (TrustHire's escrow)
  const ESCROW_WALLET = process.env.NEXT_PUBLIC_ESCROW_WALLET || "0x742d35Cc6634C0532925a3b844Bc9e7595f0aB1c";

  // Calculate ETH amount from USD
  useEffect(() => {
    const ethValue = (amount / ETH_PRICE_USD).toFixed(6);
    setEthAmount(ethValue);
  }, [amount]);

  // Check if MetaMask is installed
  const ethereum = getEthereum();
  const isMetaMaskInstalled = typeof window !== "undefined" && ethereum !== undefined;

  // Connect wallet
  const connectWallet = async () => {
    setError(null);
    const eth = getEthereum();
    
    if (!isMetaMaskInstalled || !eth) {
      setError("Please install MetaMask to continue");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(eth);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        await getBalance(accounts[0]);
        await switchNetwork();
      }
    } catch (err: unknown) {
      console.error("Error connecting wallet:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    }
  };

  // Get wallet balance
  const getBalance = async (address: string) => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      const provider = new ethers.providers.Web3Provider(eth);
      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error("Error getting balance:", err);
    }
  };

  // Switch network
  const switchNetwork = async () => {
    const eth = getEthereum();
    if (!eth) return;
    const network = SUPPORTED_NETWORKS[selectedNetwork];
    try {
      const provider = new ethers.providers.Web3Provider(eth);
      await provider.send("wallet_switchEthereumChain", [{ chainId: network.chainId }]);
    } catch (switchError: unknown) {
      // If network doesn't exist, add it
      const errorWithCode = switchError as { code?: number };
      if (errorWithCode.code === 4902) {
        try {
          const provider = new ethers.providers.Web3Provider(eth);
          await provider.send("wallet_addEthereumChain", [network]);
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      }
    }
  };

  // Process payment
  const processPayment = async () => {
    setError(null);
    setProcessing(true);

    try {
      const eth = getEthereum();
      if (!eth) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.providers.Web3Provider(eth);
      const signer = provider.getSigner();

      // Send transaction to escrow wallet
      const tx = await signer.sendTransaction({
        to: ESCROW_WALLET,
        value: ethers.utils.parseEther(ethAmount),
      });

      setTxHash(tx.hash);

      // Wait for transaction confirmation
      await tx.wait();

      onSuccess(tx.hash, selectedNetwork);
    } catch (err: unknown) {
      console.error("Payment error:", err);
      const errorMessage = err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
      setProcessing(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <IconCurrencyEthereum className="w-8 h-8" />
            <h2 className="text-xl font-bold">Crypto Payment</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <p className="text-orange-100 text-sm">
          Pay securely using MetaMask or any Web3 wallet
        </p>
      </div>

      <div className="p-6">
        {/* Payment Summary */}
        <div className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-neutral-600 dark:text-neutral-400">Project</span>
            <span className="text-neutral-900 dark:text-white font-medium text-right max-w-[200px] truncate">
              {projectTitle}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-neutral-600 dark:text-neutral-400">Freelancer</span>
            <span className="text-neutral-900 dark:text-white font-medium">{freelancerName}</span>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-600 dark:text-neutral-400">Amount (USD)</span>
              <span className="text-neutral-900 dark:text-white font-bold">${amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-400">Amount (ETH)</span>
              <div className="flex items-center gap-1 text-orange-500 font-bold text-xl">
                <IconCurrencyEthereum className="w-5 h-5" />
                {ethAmount}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              *Rate: 1 ETH ≈ ${ETH_PRICE_USD.toLocaleString()} USD
            </p>
          </div>
        </div>

        {/* Network Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Select Network
          </p>
          <div className="flex gap-2">
            {Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedNetwork(key as any);
                  if (walletConnected) switchNetwork();
                }}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                  selectedNetwork === key
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                    : "border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {network.nativeCurrency.symbol}
                {key === "sepolia" && (
                  <span className="block text-xs text-neutral-400">(Testnet)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Connection */}
        {!walletConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button
              onClick={connectWallet}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-3"
            >
              <IconWallet className="w-6 h-6" />
              Connect MetaMask
            </button>

            {!isMetaMaskInstalled && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <IconAlertCircle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  MetaMask not detected.{" "}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Install now
                  </a>
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Connected Wallet Info */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <IconCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Wallet Connected
                  </span>
                </div>
                <button
                  onClick={() => copyAddress(walletAddress)}
                  className="text-green-600 hover:text-green-700"
                >
                  {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Address</span>
                <span className="font-mono text-neutral-900 dark:text-white">
                  {formatAddress(walletAddress)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-neutral-600 dark:text-neutral-400">Balance</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-neutral-900 dark:text-white">
                    {balance ? parseFloat(balance).toFixed(4) : "0"} ETH
                  </span>
                  <button onClick={() => getBalance(walletAddress)}>
                    <IconRefresh className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Escrow Info */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <IconLock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-700 dark:text-orange-400">
                    Secure Escrow Payment
                  </p>
                  <ul className="text-orange-600 dark:text-orange-500 mt-2 space-y-1">
                    <li>• Funds sent to TrustHire escrow smart contract</li>
                    <li>• Released to freelancer upon project completion</li>
                    <li>• Full transparency on blockchain</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <IconAlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  Transaction Submitted!
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                    {formatAddress(txHash)}
                  </span>
                  <a
                    href={`${SUPPORTED_NETWORKS[selectedNetwork].blockExplorerUrls[0]}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600"
                  >
                    <IconExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {balance && parseFloat(balance) < parseFloat(ethAmount) && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <IconAlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  Insufficient balance. You need {ethAmount} ETH but have {parseFloat(balance).toFixed(4)} ETH.
                </p>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={processPayment}
              disabled={processing || (balance !== null && parseFloat(balance) < parseFloat(ethAmount))}
              className="w-full py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                <>
                  <IconCurrencyEthereum className="w-5 h-5" />
                  Pay {ethAmount} ETH
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-neutral-500 text-sm">
          <IconLock className="w-4 h-4" />
          <span>Secured by Blockchain Technology</span>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-4">
          By proceeding, you agree to TrustHire&apos;s crypto payment terms and conditions
        </p>
      </div>
    </div>
  );
}
