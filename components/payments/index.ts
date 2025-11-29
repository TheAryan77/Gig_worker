// Payment Components
export { default as RazorpayPayment } from "./RazorpayPayment";
export { default as CryptoPayment } from "./CryptoPayment";

// Payment Types
export interface PaymentTransaction {
  id?: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  amount: number;
  currency: "USD" | "INR";
  cryptoAmount?: string;
  cryptoCurrency?: "ETH" | "MATIC";
  type: "escrow" | "release";
  status: "pending" | "held" | "completed" | "refunded";
  paymentMethod: "razorpay" | "crypto" | "escrow";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  txHash?: string;
  network?: string;
  createdAt: Date;
}

// Payment Method Types
export type WorkerPaymentMethod = "upi" | "card" | "netbanking";
export type FreelancerPaymentMethod = "crypto" | "escrow";

// Razorpay Types
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Crypto Types
export interface CryptoTransaction {
  hash: string;
  network: string;
  amount: string;
  currency: string;
  from: string;
  to: string;
  status: "pending" | "confirmed" | "failed";
}

// ETH Price (in production, fetch from API like CoinGecko)
export const ETH_PRICE_USD = 2000;

// Supported Networks
export const SUPPORTED_NETWORKS = {
  ethereum: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    symbol: "ETH",
  },
  polygon: {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    symbol: "MATIC",
  },
  sepolia: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    symbol: "ETH",
  },
};

// Helper Functions
export const formatCurrency = (amount: number, currency: "USD" | "INR" = "USD") => {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `$${amount.toLocaleString("en-US")}`;
};

export const convertUSDtoETH = (usdAmount: number, ethPrice: number = ETH_PRICE_USD) => {
  return (usdAmount / ethPrice).toFixed(6);
};

export const convertINRtoUSD = (inrAmount: number, exchangeRate: number = 83) => {
  return inrAmount / exchangeRate;
};

export const truncateAddress = (address: string, chars: number = 4) => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const truncateTxHash = (hash: string, chars: number = 6) => {
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};
