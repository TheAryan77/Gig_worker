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
  IconSettings,
  IconArrowDownLeft,
  IconWallet,
  IconTrendingUp,
  IconStarFilled,
} from "@tabler/icons-react";

interface EarningRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  amount: number;
  type: "escrow" | "release";
  status: "held" | "completed";
  createdAt: Timestamp;
}

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  completedJobs: number;
  averageRating: number;
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
  const [workerCategory, setWorkerCategory] = useState<string>("");
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedJobs: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

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
          setWorkerCategory(userData.workerCategory || "");
          setSummary(prev => ({
            ...prev,
            totalEarnings: userData.totalEarnings || 0,
            averageRating: userData.averageRating || 0,
          }));
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
      let pendingEarnings = 0;
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

        if (data.type === "escrow" && data.status === "held") {
          pendingEarnings += data.amount;
        }
        if (data.type === "release" && data.status === "completed") {
          completedJobs++;
        }
      });

      // Sort by createdAt
      earningsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setEarnings(earningsData);
      setSummary(prev => ({
        ...prev,
        pendingEarnings,
        completedJobs,
      }));
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IconWallet className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-500">
                    ₹{summary.totalEarnings.toLocaleString()}
                  </p>
                </div>
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
    </div>
  );
}
