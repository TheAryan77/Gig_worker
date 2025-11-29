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
  IconPlus,
  IconHome,
  IconLogout,
  IconCash,
  IconSettings,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconReceipt,
} from "@tabler/icons-react";

interface Transaction {
  id: string;
  projectId: string;
  projectTitle: string;
  freelancerId: string;
  freelancerName: string;
  amount: number;
  type: "escrow" | "release";
  status: "held" | "completed";
  createdAt: Timestamp;
}

interface PaymentSummary {
  totalSpent: number;
  inEscrow: number;
  completedPayments: number;
}

export default function ClientPayments() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalSpent: 0,
    inEscrow: 0,
    completedPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/choice");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch transactions
  useEffect(() => {
    if (!userId) return;

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("clientId", "==", userId)
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData: Transaction[] = [];
      let totalSpent = 0;
      let inEscrow = 0;
      let completedPayments = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        transactionsData.push({
          id: doc.id,
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          freelancerId: data.freelancerId,
          freelancerName: data.freelancerName,
          amount: data.amount,
          type: data.type,
          status: data.status,
          createdAt: data.createdAt,
        });

        if (data.type === "escrow" && data.status === "held") {
          inEscrow += data.amount;
        }
        if (data.type === "release" && data.status === "completed") {
          totalSpent += data.amount;
          completedPayments++;
        }
      });

      // Sort by createdAt
      transactionsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setTransactions(transactionsData);
      setSummary({ totalSpent, inEscrow, completedPayments });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

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
      label: "Dashboard",
      href: "/client/dashboard",
      icon: <IconBriefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Post New Job",
      href: "/client/post-job",
      icon: <IconPlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Payments",
      href: "/client/payments",
      icon: <IconCash className="text-orange-500 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
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
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading payments...</p>
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
              <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
              Payment History
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Track your payments and transactions
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IconArrowUpRight className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Total Spent</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ${summary.totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <IconReceipt className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Completed Payments</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {summary.completedPayments}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                All Transactions
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                  <IconCash className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">No transactions yet</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Your payment history will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "escrow"
                              ? "bg-orange-100 dark:bg-orange-900/30"
                              : "bg-green-100 dark:bg-green-900/30"
                          }`}
                        >
                          {transaction.type === "escrow" ? (
                            <IconArrowUpRight className="w-5 h-5 text-orange-500" />
                          ) : (
                            <IconArrowDownLeft className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {transaction.projectTitle}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {transaction.type === "escrow" 
                              ? `Deposited to escrow for ${transaction.freelancerName}`
                              : `Released to ${transaction.freelancerName}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === "escrow"
                              ? "text-orange-500"
                              : "text-green-500"
                          }`}
                        >
                          -${transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          transaction.status === "held"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {transaction.status === "held" ? "In Escrow" : "Completed"}
                      </span>
                      <button
                        onClick={() => router.push(`/project/${transaction.projectId}`)}
                        className="text-xs text-orange-500 hover:underline"
                      >
                        View Project
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
