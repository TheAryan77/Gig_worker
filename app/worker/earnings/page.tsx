"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import {
  IconBriefcase,
  IconFileText,
  IconChecklist,
  IconUser,
  IconHome,
  IconLogout,
  IconCash,
  IconArrowDownLeft,
  IconWallet,
  IconTrendingUp,
  IconStarFilled,
  IconBuildingBank,
  IconCurrencyEthereum,
  IconArrowUpRight,
  IconX,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";

interface EarningRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  amount: number;
  type: "escrow" | "release" | "withdrawal";
  status: "held" | "completed" | "pending" | "processed";
  createdAt: Timestamp;
  withdrawalMethod?: "bank" | "crypto" | "razorpay";
}

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  completedJobs: number;
  averageRating: number;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
}

interface CryptoWallet {
  address: string;
  network: string;
}

interface UpiDetails {
  upiId: string;
  name: string;
}

// Worker category icons
const categoryIcons: Record<string, string> = {
  "electrician": "⚡",
  "plumber": "🔧",
  "carpenter": "🪚",
  "home-cleaner": "🧹",
  "painter": "🎨",
  "labourer": "👷",
  "gardener": "🌱",
  "ac-technician": "❄️",
  "appliance-repair": "🔌",
  "pest-control": "🐜",
  "driver": "🚗",
  "security": "🛡️",
  "cook": "👨‍🍳",
  "tailor": "🧵",
};

export default function WorkerEarnings() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [workerCategory, setWorkerCategory] = useState<string>("");
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0,
    completedJobs: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Withdrawal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "crypto" | "razorpay" | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
  });
  const [cryptoWallet, setCryptoWallet] = useState<CryptoWallet>({
    address: "",
    network: "ethereum",
  });
  const [upiDetails, setUpiDetails] = useState<UpiDetails>({
    upiId: "",
    name: "",
  });

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Get user profile for total earnings and rating
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || user.displayName || "User");
          setWorkerCategory(userData.workerCategory || "");
          setSummary(prev => ({
            ...prev,
            totalEarnings: userData.totalEarnings || 0,
            availableBalance: userData.availableBalance || userData.totalEarnings || 0,
            averageRating: userData.averageRating || 0,
          }));
          // Load saved payment details
          if (userData.bankDetails) {
            setBankDetails(userData.bankDetails);
          }
          if (userData.cryptoWallet) {
            setCryptoWallet(userData.cryptoWallet);
          }
          if (userData.upiDetails) {
            setUpiDetails(userData.upiDetails);
          }
        }
      } else {
        router.push("/choice");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch transactions/earnings
  useEffect(() => {
    if (!userId) return;

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("freelancerId", "==", userId)
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const earningsData: EarningRecord[] = [];
      let escrowEarnings = 0;
      let releasedEarnings = 0;
      let withdrawnAmount = 0;
      let completedJobs = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        earningsData.push({
          id: doc.id,
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          clientName: data.clientName,
          amount: data.amount,
          type: data.type,
          status: data.status,
          createdAt: data.createdAt,
        });

        // Count escrow amounts
        if (data.type === "escrow" && data.status === "held") {
          escrowEarnings += data.amount;
        }
        // Count released payments
        if (data.type === "release" && data.status === "completed") {
          releasedEarnings += data.amount;
          completedJobs++;
        }
        // Count withdrawals
        if (data.type === "withdrawal") {
          withdrawnAmount += data.amount;
        }
      });

      // Total earnings = escrow + released
      const totalEarnings = escrowEarnings + releasedEarnings;
      // Available balance = total - withdrawals
      const availableBalance = totalEarnings - withdrawnAmount;

      // Sort by createdAt
      earningsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setEarnings(earningsData);
      setSummary(prev => ({
        ...prev,
        totalEarnings,
        pendingEarnings: escrowEarnings,
        availableBalance: Math.max(0, availableBalance),
        completedJobs,
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Process withdrawal
  const processWithdrawal = async () => {
    if (!userId || !withdrawMethod) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > summary.availableBalance) {
      return;
    }

    setProcessingWithdraw(true);
    try {
      // Get withdrawal details based on method
      const getWithdrawalDetails = () => {
        if (withdrawMethod === "bank") {
          return { bankDetails };
        } else if (withdrawMethod === "crypto") {
          return { cryptoWallet };
        } else {
          return { upiDetails };
        }
      };

      const getProcessingNote = () => {
        if (withdrawMethod === "bank") {
          return `Bank transfer to ${bankDetails.bankName} - ${bankDetails.accountNumber.slice(-4)}`;
        } else if (withdrawMethod === "crypto") {
          return `Crypto transfer to ${cryptoWallet.address.slice(0, 8)}...${cryptoWallet.address.slice(-6)} on ${cryptoWallet.network}`;
        } else {
          return `UPI transfer to ${upiDetails.upiId}`;
        }
      };

      // Create withdrawal transaction record
      await addDoc(collection(db, "transactions"), {
        freelancerId: userId,
        freelancerName: userName,
        amount: amount,
        type: "withdrawal",
        status: "pending",
        withdrawalMethod: withdrawMethod,
        ...getWithdrawalDetails(),
        createdAt: serverTimestamp(),
      });

      // Update user's available balance
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        availableBalance: summary.availableBalance - amount,
        ...getWithdrawalDetails(),
      });

      // Create withdrawal record for admin tracking
      await addDoc(collection(db, "withdrawals"), {
        userId: userId,
        userName: userName,
        amount: amount,
        method: withdrawMethod,
        status: "pending",
        ...getWithdrawalDetails(),
        processingNote: getProcessingNote(),
        requestedAt: serverTimestamp(),
      });

      // Update local state
      setSummary(prev => ({
        ...prev,
        availableBalance: prev.availableBalance - amount,
      }));

      setWithdrawSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setWithdrawSuccess(false);
        setShowWithdrawModal(false);
        setWithdrawMethod(null);
        setWithdrawAmount("");
      }, 3000);

    } catch (error) {
      console.error("Error processing withdrawal:", error);
    } finally {
      setProcessingWithdraw(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString([], { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const sidebarLinks = [
    {
      label: "Browse Jobs",
      href: "/worker/dashboard",
      icon: <IconBriefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "My Applications",
      href: "/worker/dashboard",
      icon: <IconFileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Active Jobs",
      href: "/worker/dashboard",
      icon: <IconChecklist className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Earnings",
      href: "/worker/earnings",
      icon: <IconCash className="text-green-500 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Profile",
      href: "/worker/profile-setup",
      icon: <IconUser className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  const bottomLinks = [
    {
      label: "Home",
      href: "/",
      icon: <IconHome className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Logout",
      href: "/",
      icon: <IconLogout className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-900">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 py-2">
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">TH</span>
              </div>
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-neutral-900 dark:text-white whitespace-nowrap"
                >
                  TrustHire
                </motion.span>
              )}
            </div>

            {/* Worker Category Badge */}
            {open && workerCategory && (
              <div className="mt-4 px-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-xl">{categoryIcons[workerCategory] || "👷"}</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {formatCategoryName(workerCategory)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          
          {/* Bottom Links */}
          <div className="flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              My Earnings
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Track your income and pending payments
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconWallet className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Available Balance</p>
                    <p className="text-2xl font-bold text-green-500">
                      ₹{summary.availableBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={summary.availableBalance <= 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <IconArrowUpRight className="w-4 h-4" />
                  Withdraw
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <IconCash className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Pending (Escrow)</p>
                  <p className="text-2xl font-bold text-orange-500">
                    ₹{summary.pendingEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <IconTrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Completed Jobs</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {summary.completedJobs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <IconStarFilled className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Avg. Rating</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings History */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Earnings History
              </h2>
            </div>

            {earnings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">{categoryIcons[workerCategory] || "👷"}</div>
                <p className="text-neutral-600 dark:text-neutral-400">No earnings yet</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Complete jobs to start earning
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            earning.type === "release"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-orange-100 dark:bg-orange-900/30"
                          }`}
                        >
                          <IconArrowDownLeft
                            className={`w-5 h-5 ${
                              earning.type === "release" ? "text-green-500" : "text-orange-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {earning.projectTitle}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {earning.type === "escrow" 
                              ? `Payment secured by ${earning.clientName}`
                              : `Payment received from ${earning.clientName}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            earning.type === "release"
                              ? "text-green-500"
                              : "text-orange-500"
                          }`}
                        >
                          +₹{earning.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(earning.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          earning.type === "escrow"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {earning.type === "escrow" ? "In Escrow" : "Received"}
                      </span>
                      <button
                        onClick={() => router.push(`/project/${earning.projectId}`)}
                        className="text-xs text-green-500 hover:underline"
                      >
                        View Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowWithdrawModal(false);
                setWithdrawSuccess(false);
                setWithdrawAmount("");
                setWithdrawMethod(null);
              }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <IconX className="w-5 h-5" />
            </button>

            {withdrawSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IconCheck className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Withdrawal Initiated!
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {withdrawMethod === "razorpay" 
                    ? "Funds will be transferred within minutes via UPI"
                    : withdrawMethod === "crypto"
                    ? "Funds will be transferred within ~10 minutes"
                    : "Funds will be transferred within 1-2 business days"
                  }
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                  Withdraw Funds
                </h3>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Amount to Withdraw
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const value = Math.min(Number(e.target.value), summary.availableBalance);
                        setWithdrawAmount(value > 0 ? String(value) : "");
                      }}
                      placeholder="0.00"
                      max={summary.availableBalance}
                      className="w-full pl-8 pr-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    Available: ₹{summary.availableBalance.toLocaleString()}
                  </p>
                </div>

                {/* Withdrawal Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Withdrawal Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setWithdrawMethod("razorpay")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        withdrawMethod === "razorpay"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-green-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        withdrawMethod === "razorpay" ? "bg-green-100 dark:bg-green-900/30" : "bg-neutral-100 dark:bg-neutral-700"
                      }`}>
                        <span className="text-lg font-bold text-green-500">₹</span>
                      </div>
                      <span className={`font-medium text-sm ${withdrawMethod === "razorpay" ? "text-green-600 dark:text-green-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                        UPI
                      </span>
                      <span className="text-[10px] text-green-500 font-medium">Instant</span>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod("bank")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        withdrawMethod === "bank"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-green-300"
                      }`}
                    >
                      <IconBuildingBank className={`w-8 h-8 ${withdrawMethod === "bank" ? "text-green-500" : "text-neutral-500"}`} />
                      <span className={`font-medium text-sm ${withdrawMethod === "bank" ? "text-green-600 dark:text-green-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                        Bank
                      </span>
                      <span className="text-[10px] text-neutral-500">1-2 days</span>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod("crypto")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        withdrawMethod === "crypto"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-green-300"
                      }`}
                    >
                      <IconCurrencyEthereum className={`w-8 h-8 ${withdrawMethod === "crypto" ? "text-green-500" : "text-neutral-500"}`} />
                      <span className={`font-medium text-sm ${withdrawMethod === "crypto" ? "text-green-600 dark:text-green-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                        Crypto
                      </span>
                      <span className="text-[10px] text-neutral-500">~10 min</span>
                    </button>
                  </div>
                </div>

                {/* UPI Details Form */}
                {withdrawMethod === "razorpay" && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <span className="text-lg">⚡</span>
                      <span>Instant transfer via UPI - funds arrive within minutes!</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Name (as per UPI)
                      </label>
                      <input
                        type="text"
                        value={upiDetails.name}
                        onChange={(e) => setUpiDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiDetails.upiId}
                        onChange={(e) => setUpiDetails(prev => ({ ...prev, upiId: e.target.value.toLowerCase() }))}
                        placeholder="yourname@upi"
                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Examples: name@okicici, name@ybl, name@paytm
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank Details Form */}
                {withdrawMethod === "bank" && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="State Bank of India"
                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="1234567890"
                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bankDetails.ifscCode}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                        placeholder="SBIN0001234"
                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* Crypto Wallet Form */}
                {withdrawMethod === "crypto" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Wallet Address (ETH/Polygon)
                    </label>
                    <input
                      type="text"
                      value={cryptoWallet.address}
                      onChange={(e) => setCryptoWallet(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="0x..."
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    />
                    <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                      <IconAlertCircle className="w-3 h-3" />
                      Ensure the wallet address is correct. Transactions are irreversible.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={processWithdrawal}
                  disabled={
                    processingWithdraw ||
                    !withdrawAmount ||
                    !withdrawMethod ||
                    Number(withdrawAmount) <= 0 ||
                    Number(withdrawAmount) > summary.availableBalance ||
                    (withdrawMethod === "bank" && (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountName || !bankDetails.bankName)) ||
                    (withdrawMethod === "crypto" && !cryptoWallet.address) ||
                    (withdrawMethod === "razorpay" && (!upiDetails.upiId || !upiDetails.name || !upiDetails.upiId.includes("@")))
                  }
                  className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {processingWithdraw ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IconArrowUpRight className="w-5 h-5" />
                      Withdraw ₹{Number(withdrawAmount || 0).toLocaleString()}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
