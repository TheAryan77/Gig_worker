"use client";

import React from "react";
import { useWallet, formatAddress, getNetworkName } from "@/hooks/use-wallet";

interface ConnectWalletButtonProps {
  className?: string;
  showBalance?: boolean;
  showNetwork?: boolean;
}

export function ConnectWalletButton({
  className = "",
  showBalance = true,
  showNetwork = false,
}: ConnectWalletButtonProps) {
  const {
    wallet,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    addLocalNetwork,
    clearError,
  } = useWallet();

  if (!wallet.isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className={`px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 ${className}`}
      >
        <MetaMaskIcon />
        Install MetaMask
      </a>
    );
  }

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-2">
        {showNetwork && (
          <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded-lg">
            {getNetworkName(wallet.chainId)}
          </span>
        )}
        <div className="relative group">
          <button
            className={`px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 ${className}`}
          >
            <MetaMaskIcon />
            <span className="font-medium">{formatAddress(wallet.address)}</span>
            {showBalance && wallet.balance && (
              <span className="text-orange-200 text-sm">
                ({wallet.balance} ETH)
              </span>
            )}
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-2">
              <button
                onClick={addLocalNetwork}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
              >
                Add Local Network
              </button>
              <button
                onClick={disconnectWallet}
                className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={connectWallet}
        disabled={loading}
        className={`px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 ${className}`}
      >
        <MetaMaskIcon />
        {loading ? "Connecting..." : "Connect Wallet"}
      </button>
      
      {error && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-500 z-50">
          {error}
          <button
            onClick={clearError}
            className="block mt-2 text-xs text-red-400 hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 212 189" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0)">
        <path d="M201.019 1L119.243 61.8171L134.073 25.6714L201.019 1Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.9033 1L91.9613 62.4343L77.927 25.6714L10.9033 1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M171.549 137.549L149.996 170.865L196.323 183.549L209.623 138.257L171.549 137.549Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.45508 138.257L15.677 183.549L61.9265 170.865L40.4513 137.549L2.45508 138.257Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M59.456 81.5714L46.623 101.048L92.5957 103.143L91.0352 53.2571L59.456 81.5714Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M152.466 81.5714L120.418 52.64L119.243 103.143L165.138 101.048L152.466 81.5714Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M61.9268 170.865L89.8643 157.097L65.8265 138.566L61.9268 170.865Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M122.058 157.097L149.996 170.865L146.096 138.566L122.058 157.097Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M149.996 170.865L122.058 157.097L124.309 174.634L124.075 182.932L149.996 170.865Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M61.9268 170.865L87.8479 182.932L87.692 174.634L89.8643 157.097L61.9268 170.865Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M88.3046 122.914L65.2012 116.229L81.5326 108.857L88.3046 122.914Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M123.617 122.914L130.389 108.857L146.799 116.229L123.617 122.914Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M61.9267 170.865L65.9822 137.549L40.4512 138.257L61.9267 170.865Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M146.018 137.549L149.996 170.865L171.549 138.257L146.018 137.549Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M165.138 101.048L119.243 103.143L123.695 122.914L130.467 108.857L146.877 116.229L165.138 101.048Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M65.2011 116.229L81.6106 108.857L88.3045 122.914L92.8346 103.143L46.623 101.048L65.2011 116.229Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M46.623 101.048L65.8266 138.566L65.2011 116.229L46.623 101.048Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M146.877 116.229L146.096 138.566L165.138 101.048L146.877 116.229Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M92.8345 103.143L88.3044 122.914L93.9959 152.011L95.2453 118.154L92.8345 103.143Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M119.243 103.143L116.91 118.077L117.926 152.011L123.695 122.914L119.243 103.143Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M123.695 122.914L117.926 152.011L122.058 157.097L146.096 138.566L146.877 116.229L123.695 122.914Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M65.2012 116.229L65.8267 138.566L89.8645 157.097L93.996 152.011L88.3046 122.914L65.2012 116.229Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M124.075 182.932L124.309 174.634L122.214 172.771H89.7084L87.692 174.634L87.8479 182.932L61.9268 170.865L71.3829 178.549L89.4748 190.771H122.448L140.617 178.549L149.996 170.865L124.075 182.932Z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M122.058 157.097L117.926 152.011H93.996L89.8645 157.097L87.692 174.634L89.7084 172.771H122.214L124.309 174.634L122.058 157.097Z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M204.372 65.3886L211.066 33.4743L201.019 1L122.058 58.1486L152.466 81.5714L195.463 94.1771L204.762 83.3486L200.706 80.4686L207.244 74.5486L202.168 70.5714L208.706 65.5429L204.372 65.3886Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M0.933594 33.4743L7.62788 65.3886L3.21645 65.5429L9.75431 70.5714L4.75574 74.5486L11.2936 80.4686L7.23788 83.3486L16.4593 94.1771L59.4564 81.5714L89.8649 58.1486L10.9036 1L0.933594 33.4743Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M195.463 94.1771L152.466 81.5714L165.138 101.048L146.096 138.566L171.549 138.257H209.623L195.463 94.1771Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M59.4561 81.5714L16.459 94.1771L2.45508 138.257H40.4513L65.8265 138.566L46.6229 101.048L59.4561 81.5714Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M119.243 103.143L122.058 58.1486L134.151 25.6714H77.9268L89.8644 58.1486L92.8347 103.143L93.9283 118.231L93.9962 152.011H117.926L118.072 118.231L119.243 103.143Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="212" height="189" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

export default ConnectWalletButton;
