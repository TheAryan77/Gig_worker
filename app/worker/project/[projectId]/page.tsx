"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  IconSend,
  IconPhone,
  IconVideo,
  IconCheck,
  IconX,
  IconFileText,
  IconArrowLeft,
  IconMessageCircle,
  IconClipboardCheck,
  IconAlertCircle,
  IconStar,
  IconStarFilled,
  IconWallet,
  IconLock,
  IconCash,
  IconCurrencyRupee,
  IconMapPin,
  IconClock,
} from "@tabler/icons-react";
import RazorpayPayment from "@/components/payments/RazorpayPayment";

interface Project {
  id: string;
  jobId: string;
  jobTitle: string;
  description: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  budget: string;
  budgetAmount: number;
  status: "pending-agreement" | "pending-payment" | "payment-secured" | "in-progress" | "completed";
  clientAgreed: boolean;
  freelancerAgreed: boolean;
  paymentStatus: "pending" | "escrow" | "released";
  escrowAmount?: number;
  paidAt?: Timestamp;
  releasedAt?: Timestamp;
  currentStage: number;
  stages: {
    name: string;
    description: string;
    status: "pending" | "in-progress" | "completed";
    completedAt?: Timestamp;
  }[];
  createdAt: Timestamp;
  agreedAt?: Timestamp;
  completedAt?: Timestamp;
  location?: string;
  workerCategory?: string;
  jobCategory?: string;
  rating?: {
    stars: number;
    feedback: string;
    ratedAt: Timestamp;
  };
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "worker";
  content: string;
  type: "text" | "system";
  createdAt: Timestamp;
}

export default function WorkerProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<"client" | "worker" | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "progress" | "agreement">("agreement");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoverStars, setHoverStars] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || user.displayName || "User");
        }
      } else {
        router.push("/choice");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch project data
  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Project;
        setProject(data);

        if (userId) {
          if (data.clientId === userId) {
            setUserRole("client");
          } else if (data.freelancerId === userId) {
            setUserRole("worker");
          }
        }

        if (!data.clientAgreed || !data.freelancerAgreed) {
          setActiveTab("agreement");
        } else if (data.status === "in-progress") {
          setActiveTab("progress");
        }

        setLoading(false);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [projectId, userId, router]);

  // Fetch messages
  useEffect(() => {
    if (!projectId) return;

    const messagesQuery = query(
      collection(db, "projects", projectId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !userRole || !project) return;

    setSendingMessage(true);
    try {
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        content: newMessage.trim(),
        type: "text",
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Sign agreement
  const signAgreement = async () => {
    if (!project || !userId || !userRole) return;

    setAgreeing(true);
    try {
      const updateData: Record<string, unknown> = {};

      if (userRole === "client") {
        updateData.clientAgreed = true;
      } else {
        updateData.freelancerAgreed = true;
      }

      const otherPartyAgreed = userRole === "client" ? project.freelancerAgreed : project.clientAgreed;

      if (otherPartyAgreed) {
        updateData.status = "pending-payment";
        updateData.agreedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "projects", projectId), updateData);

      const systemMessage = otherPartyAgreed 
        ? `${userName} has signed the agreement. Waiting for client to secure payment via UPI/Razorpay.`
        : `${userName} has signed the agreement.`;
      
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: userRole,
        content: systemMessage,
        type: "system",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error signing agreement:", error);
    } finally {
      setAgreeing(false);
    }
  };

  // Handle Razorpay payment success
  const handlePaymentSuccess = async (paymentId: string, orderId: string) => {
    if (!project) return;

    try {
      // Extract budget amount
      const budgetMatch = project.budget.match(/₹?([\d,]+)/g);
      let escrowAmount = 0;
      if (budgetMatch && budgetMatch.length >= 2) {
        const min = parseFloat(budgetMatch[0].replace(/[₹,]/g, ""));
        const max = parseFloat(budgetMatch[1].replace(/[₹,]/g, ""));
        escrowAmount = (min + max) / 2;
      } else if (budgetMatch) {
        escrowAmount = parseFloat(budgetMatch[0].replace(/[₹,]/g, ""));
      }

      // Initialize stages for worker jobs
      const defaultStages = [
        {
          name: "Job Accepted",
          description: "Worker has confirmed the job and is preparing",
          status: "in-progress",
        },
        {
          name: "Work in Progress",
          description: "Worker is performing the service",
          status: "pending",
        },
        {
          name: "Job Completed",
          description: "Work completed and verified by client",
          status: "pending",
        },
      ];

      let stagesToUse = defaultStages;
      if (project.stages && Array.isArray(project.stages) && project.stages.length > 0) {
        stagesToUse = project.stages.map((stage, index) => ({
          ...stage,
          status: index === 0 ? "in-progress" : stage.status,
        }));
      }

      await updateDoc(doc(db, "projects", projectId), {
        status: "in-progress",
        paymentStatus: "escrow",
        escrowAmount: escrowAmount,
        budgetAmount: escrowAmount,
        paidAt: serverTimestamp(),
        stages: stagesToUse,
        currentStage: 0,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
      });

      await addDoc(collection(db, "transactions"), {
        projectId: projectId,
        projectTitle: project.jobTitle,
        clientId: project.clientId,
        clientName: project.clientName,
        freelancerId: project.freelancerId,
        freelancerName: project.freelancerName,
        amount: escrowAmount,
        currency: "INR",
        type: "escrow",
        status: "held",
        paymentMethod: "razorpay",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "client",
        content: `💰 ${project.clientName} has deposited ₹${escrowAmount.toLocaleString("en-IN")} via UPI into escrow. The job is now active! Payment will be released to ${project.freelancerName} upon completion.`,
        type: "system",
        createdAt: serverTimestamp(),
      });

      setShowPaymentModal(false);
      setProcessingPayment(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      setProcessingPayment(false);
    }
  };

  // Release payment to worker
  const releasePayment = async () => {
    if (!project || project.paymentStatus !== "escrow") return;

    try {
      const escrowAmount = project.escrowAmount || 0;

      await updateDoc(doc(db, "projects", projectId), {
        paymentStatus: "released",
        releasedAt: serverTimestamp(),
      });

      const workerRef = doc(db, "users", project.freelancerId);
      const workerDoc = await getDoc(workerRef);
      
      if (workerDoc.exists()) {
        const currentEarnings = workerDoc.data().totalEarnings || 0;
        const earningsHistory = workerDoc.data().earningsHistory || [];
        
        await updateDoc(workerRef, {
          totalEarnings: currentEarnings + escrowAmount,
          earningsHistory: [...earningsHistory, {
            projectId: projectId,
            projectTitle: project.jobTitle,
            clientName: project.clientName,
            amount: escrowAmount,
            currency: "INR",
            releasedAt: serverTimestamp(),
          }],
        });
      }

      await addDoc(collection(db, "transactions"), {
        projectId: projectId,
        projectTitle: project.jobTitle,
        clientId: project.clientId,
        clientName: project.clientName,
        freelancerId: project.freelancerId,
        freelancerName: project.freelancerName,
        amount: escrowAmount,
        currency: "INR",
        type: "release",
        status: "completed",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        content: `🎉 Payment of ₹${escrowAmount.toLocaleString("en-IN")} has been released to ${project.freelancerName}. Thank you for using TrustHire!`,
        type: "system",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error releasing payment:", error);
    }
  };

  // Update stage (worker only)
  const updateStage = async (stageIndex: number, newStatus: "in-progress" | "completed") => {
    if (!project || userRole !== "worker" || !project.stages || !Array.isArray(project.stages)) return;

    setUpdatingStage(true);
    try {
      const updatedStages = [...project.stages];
      updatedStages[stageIndex].status = newStatus;

      if (newStatus === "completed") {
        updatedStages[stageIndex].completedAt = Timestamp.now();

        if (stageIndex < updatedStages.length - 1) {
          updatedStages[stageIndex + 1].status = "in-progress";
        }
      }

      const updateData: Record<string, unknown> = {
        stages: updatedStages,
        currentStage: newStatus === "completed" && stageIndex < updatedStages.length - 1
          ? stageIndex + 1
          : stageIndex,
      };

      if (newStatus === "completed" && stageIndex === updatedStages.length - 1) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "projects", projectId), updateData);

      if (newStatus === "completed" && stageIndex === updatedStages.length - 1) {
        await releasePayment();
      }

      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "worker",
        content: `Stage "${updatedStages[stageIndex].name}" has been marked as ${newStatus}.`,
        type: "system",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating stage:", error);
    } finally {
      setUpdatingStage(false);
    }
  };

  // Submit rating
  const submitRating = async () => {
    if (!project || userRole !== "client" || ratingStars === 0) return;

    setSubmittingRating(true);
    try {
      await updateDoc(doc(db, "projects", projectId), {
        rating: {
          stars: ratingStars,
          feedback: ratingFeedback.trim(),
          ratedAt: serverTimestamp(),
        },
      });

      const workerRef = doc(db, "users", project.freelancerId);
      const workerDoc = await getDoc(workerRef);
      
      if (workerDoc.exists()) {
        const workerData = workerDoc.data();
        const currentRatings = workerData.ratings || [];
        const newRating = {
          projectId: projectId,
          projectTitle: project.jobTitle,
          clientId: project.clientId,
          clientName: project.clientName,
          stars: ratingStars,
          feedback: ratingFeedback.trim(),
          ratedAt: serverTimestamp(),
        };
        
        await updateDoc(workerRef, {
          ratings: [...currentRatings, newRating],
          averageRating: calculateAverageRating([...currentRatings, newRating]),
          totalReviews: currentRatings.length + 1,
        });
      }

      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "client",
        content: `⭐ ${userName} rated this job ${ratingStars} star${ratingStars > 1 ? "s" : ""}.`,
        type: "system",
        createdAt: serverTimestamp(),
      });

      const escrowAmount = project.escrowAmount || 0;
      if (escrowAmount > 0) {
        await addDoc(collection(db, "projects", projectId, "messages"), {
          senderId: "system",
          senderName: "System",
          senderRole: "system",
          content: `💰 ₹${escrowAmount.toLocaleString("en-IN")} has been credited to ${project.freelancerName}'s account. Thank you for using TrustHire!`,
          type: "system",
          createdAt: serverTimestamp(),
        });
      }

      setShowRatingModal(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const calculateAverageRating = (ratings: { stars: number }[]) => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.stars, 0);
    return Math.round((total / ratings.length) * 10) / 10;
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const getProgress = () => {
    if (!project || !project.stages || !Array.isArray(project.stages) || project.stages.length === 0) return 0;
    const completed = project.stages.filter((s) => s.status === "completed").length;
    return Math.round((completed / project.stages.length) * 100);
  };

  const getStages = () => {
    if (!project || !project.stages || !Array.isArray(project.stages)) {
      return [
        { name: "Job Accepted", description: "Worker confirmed", status: "pending" as const },
        { name: "Work in Progress", description: "Performing service", status: "pending" as const },
        { name: "Job Completed", description: "Work verified", status: "pending" as const },
      ];
    }
    return project.stages;
  };

  // Extract budget amount for payment
  const getBudgetAmount = () => {
    if (!project) return 0;
    const budgetMatch = project.budget.match(/₹?([\d,]+)/g);
    if (budgetMatch && budgetMatch.length >= 2) {
      const min = parseFloat(budgetMatch[0].replace(/[₹,]/g, ""));
      const max = parseFloat(budgetMatch[1].replace(/[₹,]/g, ""));
      return (min + max) / 2;
    } else if (budgetMatch) {
      return parseFloat(budgetMatch[0].replace(/[₹,]/g, ""));
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <p className="text-neutral-600 dark:text-neutral-400">Job not found</p>
      </div>
    );
  }

  const hasUserAgreed = userRole === "client" ? project.clientAgreed : project.freelancerAgreed;
  const hasOtherAgreed = userRole === "client" ? project.freelancerAgreed : project.clientAgreed;
  const bothAgreed = project.clientAgreed && project.freelancerAgreed;

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Left Panel */}
      <div className="w-80 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => router.push(userRole === "client" ? "/client/dashboard" : "/worker/dashboard")}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
            {project.jobTitle}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {userRole === "client" ? `Worker: ${project.freelancerName}` : `Client: ${project.clientName}`}
          </p>
          {project.location && (
            <div className="flex items-center gap-1 mt-2 text-sm text-neutral-500">
              <IconMapPin className="w-4 h-4" />
              {project.location}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                project.status === "pending-agreement"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                  : project.status === "pending-payment"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : project.status === "in-progress"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : project.status === "completed"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              }`}
            >
              {project.status === "pending-agreement"
                ? "Pending Agreement"
                : project.status === "pending-payment"
                ? "Pending Payment"
                : project.status === "in-progress"
                ? "In Progress"
                : "Completed"}
            </span>
          </div>
        </div>

        {/* Budget & Progress */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-neutral-500">Budget</span>
            <span className="text-sm font-semibold text-green-500">{project.budget}</span>
          </div>
          {bothAgreed && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-500">Progress</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{getProgress()}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgress()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-1 p-4">
          <button
            onClick={() => setActiveTab("agreement")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeTab === "agreement"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <IconFileText className="w-5 h-5" />
            Agreement
            {!bothAgreed && (
              <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeTab === "chat"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <IconMessageCircle className="w-5 h-5" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            disabled={!bothAgreed}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeTab === "progress"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : !bothAgreed
                ? "opacity-50 cursor-not-allowed text-neutral-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <IconClipboardCheck className="w-5 h-5" />
            Progress
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-auto p-4 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 mb-3">Quick Actions</p>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm">
              <IconPhone className="w-4 h-4" />
              Call
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm">
              <IconVideo className="w-4 h-4" />
              Video
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col">
        {/* Agreement Tab */}
        {activeTab === "agreement" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {/* Agreement Header - Green for workers */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">Job Agreement</h2>
                  <p className="text-green-100">
                    Both parties must agree to the terms before the job can begin
                  </p>
                </div>

                {/* Agreement Status */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        project.clientAgreed
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                      }`}
                    >
                      {project.clientAgreed ? <IconCheck className="w-4 h-4" /> : <IconX className="w-4 h-4" />}
                      Client: {project.clientAgreed ? "Agreed" : "Pending"}
                    </div>
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        project.freelancerAgreed
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                      }`}
                    >
                      {project.freelancerAgreed ? <IconCheck className="w-4 h-4" /> : <IconX className="w-4 h-4" />}
                      Worker: {project.freelancerAgreed ? "Agreed" : "Pending"}
                    </div>
                  </div>
                </div>

                {/* Agreement Content */}
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                      Job Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Job Title</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{project.jobTitle}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Client</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{project.clientName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Worker</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{project.freelancerName}</span>
                      </div>
                      {project.location && (
                        <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                          <span className="text-neutral-500">Location</span>
                          <span className="text-neutral-900 dark:text-white font-medium">{project.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Budget</span>
                        <span className="text-green-500 font-semibold">{project.budget}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                      Job Stages
                    </h3>
                    <div className="space-y-3">
                      {getStages().map((stage, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-500 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{stage.name}</p>
                            <p className="text-sm text-neutral-500">{stage.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                      Terms & Conditions
                    </h3>
                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                      <p>1. The worker agrees to complete the job as described within the agreed timeline.</p>
                      <p>2. The client agrees to provide access and necessary information in a timely manner.</p>
                      <p>3. Payment will be processed via UPI/Razorpay and held in escrow until job completion.</p>
                      <p>4. Both parties agree to communicate professionally and resolve disputes amicably.</p>
                      <p>5. Payment will be released to the worker upon satisfactory completion of work.</p>
                    </div>
                  </div>

                  {/* Sign / Payment Buttons */}
                  {!hasUserAgreed ? (
                    <div className="pt-4">
                      <button
                        onClick={signAgreement}
                        disabled={agreeing}
                        className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {agreeing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <IconCheck className="w-5 h-5" />
                            I Agree to the Terms
                          </>
                        )}
                      </button>
                    </div>
                  ) : !hasOtherAgreed ? (
                    <div className="pt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 flex items-start gap-3">
                      <IconAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">
                          Waiting for {userRole === "client" ? "worker" : "client"} to agree
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                          You have signed the agreement. The job will begin once the other party signs.
                        </p>
                      </div>
                    </div>
                  ) : project.status === "pending-payment" ? (
                    userRole === "client" ? (
                      <div className="pt-4 space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
                          <IconCurrencyRupee className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">
                              Secure Payment Required (UPI/Razorpay)
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                              Both parties have agreed. Pay via UPI or Card to start the job. Payment will be held securely until job completion.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                        >
                          <IconCurrencyRupee className="w-5 h-5" />
                          Pay Now & Start Job
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                        <IconLock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-700 dark:text-blue-400">
                            Waiting for Client Payment
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                            Both parties have agreed. Waiting for the client to pay via UPI/Razorpay. Once paid, you can start the job.
                          </p>
                        </div>
                      </div>
                    )
                  ) : project.paymentStatus === "escrow" ? (
                    <div className="pt-4 space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
                        <IconCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            Payment Secured in Escrow
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                            ₹{project.escrowAmount?.toLocaleString("en-IN")} is safely held in escrow. The job is now active!
                          </p>
                        </div>
                      </div>
                      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <IconCash className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm text-neutral-500">Escrow Amount</p>
                              <p className="text-lg font-bold text-neutral-900 dark:text-white">₹{project.escrowAmount?.toLocaleString("en-IN")}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                            Secured
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : project.paymentStatus === "released" ? (
                    <div className="pt-4 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
                      <IconCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Payment Released!
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                          ₹{project.escrowAmount?.toLocaleString("en-IN")} has been released to {project.freelancerName}.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <IconMessageCircle className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500">No messages yet</p>
                    <p className="text-sm text-neutral-400 mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === userId;
                      const isSystem = message.type === "system";

                      if (isSystem) {
                        return (
                          <div key={message.id} className="text-center">
                            <span className="inline-block px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-sm rounded-full">
                              {message.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] ${isOwnMessage ? "order-2" : ""}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? "bg-green-500 text-white rounded-br-sm"
                                  : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm border border-neutral-200 dark:border-neutral-700"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className={`text-xs text-neutral-400 mt-1 ${isOwnMessage ? "text-right" : ""}`}>
                              {message.senderName} • {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
              <div className="max-w-2xl mx-auto flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border-0 focus:ring-2 focus:ring-green-500 text-neutral-900 dark:text-white placeholder-neutral-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  <IconSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && bothAgreed && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                  Job Stages
                </h2>

                <div className="space-y-6">
                  {getStages().map((stage, index) => (
                    <div key={index} className="relative">
                      {index < getStages().length - 1 && (
                        <div
                          className={`absolute left-4 top-10 w-0.5 h-full -mb-6 ${
                            stage.status === "completed"
                              ? "bg-green-500"
                              : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                        />
                      )}

                      <div className="flex gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            stage.status === "completed"
                              ? "bg-green-500"
                              : stage.status === "in-progress"
                              ? "bg-green-500"
                              : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                        >
                          {stage.status === "completed" ? (
                            <IconCheck className="w-4 h-4 text-white" />
                          ) : (
                            <span
                              className={`text-sm font-semibold ${
                                stage.status === "in-progress" ? "text-white" : "text-neutral-500"
                              }`}
                            >
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-neutral-900 dark:text-white">
                                {stage.name}
                              </h3>
                              <p className="text-sm text-neutral-500 mt-1">{stage.description}</p>
                              {stage.completedAt && (
                                <p className="text-xs text-green-500 mt-2">
                                  Completed on {formatDate(stage.completedAt)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {stage.status === "completed" ? (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                  Completed
                                </span>
                              ) : stage.status === "in-progress" ? (
                                <>
                                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                    In Progress
                                  </span>
                                  {userRole === "worker" && (
                                    <button
                                      onClick={() => updateStage(index, "completed")}
                                      disabled={updatingStage}
                                      className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-all disabled:opacity-50"
                                    >
                                      {updatingStage ? "..." : "Mark Complete"}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 text-xs rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall Progress */}
                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-600 dark:text-neutral-400">Overall Progress</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{getProgress()}%</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgress()}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {project.status === "completed" && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center gap-3">
                      <IconCheck className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Job Completed! 🎉
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          All stages have been successfully completed.
                        </p>
                      </div>
                    </div>

                    {project.rating ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-green-700 dark:text-green-400">Your Rating</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <IconStarFilled
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= project.rating!.stars
                                    ? "text-yellow-500"
                                    : "text-neutral-300 dark:text-neutral-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {project.rating.feedback && (
                          <p className="text-sm text-green-600 dark:text-green-300 italic">
                            &quot;{project.rating.feedback}&quot;
                          </p>
                        )}
                      </div>
                    ) : userRole === "client" ? (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="w-full p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <IconStar className="w-5 h-5" />
                        Rate This Worker
                      </button>
                    ) : (
                      <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-center">
                        <p className="text-sm text-neutral-500">
                          Waiting for client to submit rating...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h2 className="text-xl font-bold">Rate Your Experience</h2>
              <p className="text-green-100 text-sm mt-1">
                How was your experience working with {project?.freelancerName}?
              </p>
            </div>

            <div className="p-6">
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverStars(star)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => setRatingStars(star)}
                    className="transition-transform hover:scale-110"
                  >
                    {star <= (hoverStars || ratingStars) ? (
                      <IconStarFilled className="w-10 h-10 text-yellow-500" />
                    ) : (
                      <IconStar className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-center text-neutral-600 dark:text-neutral-400 mb-4">
                {ratingStars === 0
                  ? "Select your rating"
                  : ratingStars === 1
                  ? "Poor"
                  : ratingStars === 2
                  ? "Fair"
                  : ratingStars === 3
                  ? "Good"
                  : ratingStars === 4
                  ? "Very Good"
                  : "Excellent!"}
              </p>

              <textarea
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Share your experience (optional)..."
                className="w-full p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl border-0 focus:ring-2 focus:ring-green-500 text-neutral-900 dark:text-white placeholder-neutral-400 resize-none"
                rows={4}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRatingStars(0);
                    setRatingFeedback("");
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={ratingStars === 0 || submittingRating}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingRating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4" />
                      Submit Rating
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Razorpay Payment Modal */}
      {showPaymentModal && project && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <RazorpayPayment
              amount={getBudgetAmount()}
              projectTitle={project.jobTitle}
              freelancerName={project.freelancerName}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPaymentModal(false);
                setProcessingPayment(false);
              }}
              processing={processingPayment}
              setProcessing={setProcessingPayment}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
