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
  IconCurrencyEthereum,
  IconCurrencyBitcoin,
} from "@tabler/icons-react";
import CryptoPayment from "@/components/payments/CryptoPayment";

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
  senderRole: "client" | "freelancer";
  content: string;
  type: "text" | "system";
  createdAt: Timestamp;
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<"client" | "freelancer" | null>(null);
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
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "escrow" | null>(null);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);

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
        // Get user details
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

        // Determine user role
        if (userId) {
          if (data.clientId === userId) {
            setUserRole("client");
          } else if (data.freelancerId === userId) {
            setUserRole("freelancer");
          }
        }

        // Set active tab based on agreement status
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

      // Check if both have agreed
      const otherPartyAgreed = userRole === "client" ? project.freelancerAgreed : project.clientAgreed;

      if (otherPartyAgreed) {
        // Both agreed - now client needs to pay
        updateData.status = "pending-payment";
        updateData.agreedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "projects", projectId), updateData);

      // Add system message
      const systemMessage = otherPartyAgreed 
        ? `${userName} has signed the agreement. Waiting for client to secure payment in escrow.`
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

  // Process payment (client only) - simulate payment and hold in escrow
  const processPayment = async () => {
    if (!project || userRole !== "client") return;

    setProcessingPayment(true);
    try {
      // Extract budget amount from budget string (e.g., "$500 - $1000" -> 750)
      const budgetMatch = project.budget.match(/\$?([\d,]+)/g);
      let escrowAmount = 0;
      if (budgetMatch && budgetMatch.length >= 2) {
        const min = parseFloat(budgetMatch[0].replace(/[$,]/g, ""));
        const max = parseFloat(budgetMatch[1].replace(/[$,]/g, ""));
        escrowAmount = (min + max) / 2; // Use average of budget range
      } else if (budgetMatch) {
        escrowAmount = parseFloat(budgetMatch[0].replace(/[$,]/g, ""));
      }

      // Initialize stages
      const defaultStages = [
        {
          name: "Planning & Setup",
          description: "Initial project setup, requirements gathering, and planning phase",
          status: "in-progress",
        },
        {
          name: "Development",
          description: "Main development work, implementing core features and functionality",
          status: "pending",
        },
        {
          name: "Testing & Delivery",
          description: "Final testing, bug fixes, documentation, and project handover",
          status: "pending",
        },
      ];

      // Update stages
      let stagesToUse = defaultStages;
      if (project.stages && Array.isArray(project.stages) && project.stages.length > 0) {
        stagesToUse = project.stages.map((stage, index) => ({
          ...stage,
          status: index === 0 ? "in-progress" : stage.status,
        }));
      }

      // Update project with payment info and start project
      await updateDoc(doc(db, "projects", projectId), {
        status: "in-progress",
        paymentStatus: "escrow",
        escrowAmount: escrowAmount,
        budgetAmount: escrowAmount,
        paidAt: serverTimestamp(),
        stages: stagesToUse,
        currentStage: 0,
      });

      // Record the escrow transaction
      await addDoc(collection(db, "transactions"), {
        projectId: projectId,
        projectTitle: project.jobTitle,
        clientId: project.clientId,
        clientName: project.clientName,
        freelancerId: project.freelancerId,
        freelancerName: project.freelancerName,
        amount: escrowAmount,
        type: "escrow",
        status: "held",
        createdAt: serverTimestamp(),
      });

      // Add system message
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "client",
        content: `💰 ${project.clientName} has deposited $${escrowAmount.toLocaleString()} into escrow. The project is now active! The payment will be released to ${project.freelancerName} upon project completion.`,
        type: "system",
        createdAt: serverTimestamp(),
      });

      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle crypto payment success (MetaMask)
  const handleCryptoPaymentSuccess = async (txHash: string, network: string) => {
    if (!project || userRole !== "client") return;

    try {
      // Extract budget amount
      const budgetMatch = project.budget.match(/\$?([\d,]+)/g);
      let escrowAmount = 0;
      if (budgetMatch && budgetMatch.length >= 2) {
        const min = parseFloat(budgetMatch[0].replace(/[$,]/g, ""));
        const max = parseFloat(budgetMatch[1].replace(/[$,]/g, ""));
        escrowAmount = (min + max) / 2;
      } else if (budgetMatch) {
        escrowAmount = parseFloat(budgetMatch[0].replace(/[$,]/g, ""));
      }

      // Convert to ETH for display (using mock rate)
      const ethAmount = (escrowAmount / 2000).toFixed(6);

      // Initialize stages
      const defaultStages = [
        {
          name: "Planning & Setup",
          description: "Initial project setup, requirements gathering, and planning phase",
          status: "in-progress",
        },
        {
          name: "Development",
          description: "Main development work, implementing core features and functionality",
          status: "pending",
        },
        {
          name: "Testing & Delivery",
          description: "Final testing, bug fixes, documentation, and project handover",
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

      // Update project with crypto payment info
      await updateDoc(doc(db, "projects", projectId), {
        status: "in-progress",
        paymentStatus: "escrow",
        escrowAmount: escrowAmount,
        budgetAmount: escrowAmount,
        paidAt: serverTimestamp(),
        stages: stagesToUse,
        currentStage: 0,
        paymentMethod: "crypto",
        cryptoTxHash: txHash,
        cryptoNetwork: network,
      });

      // Record the crypto escrow transaction
      await addDoc(collection(db, "transactions"), {
        projectId: projectId,
        projectTitle: project.jobTitle,
        clientId: project.clientId,
        clientName: project.clientName,
        freelancerId: project.freelancerId,
        freelancerName: project.freelancerName,
        amount: escrowAmount,
        currency: "USD",
        cryptoAmount: ethAmount,
        cryptoCurrency: "ETH",
        type: "escrow",
        status: "held",
        paymentMethod: "crypto",
        txHash: txHash,
        network: network,
        createdAt: serverTimestamp(),
      });

      // Add system message
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "client",
        content: `🔗 ${project.clientName} has deposited ${ethAmount} ETH ($${escrowAmount.toLocaleString()}) via MetaMask into escrow. The project is now active! Transaction: ${txHash.slice(0, 10)}...`,
        type: "system",
        createdAt: serverTimestamp(),
      });

      setShowCryptoPayment(false);
      setShowPaymentModal(false);
      setProcessingPayment(false);
    } catch (error) {
      console.error("Error processing crypto payment:", error);
      setProcessingPayment(false);
    }
  };

  // Get budget amount in USD for crypto conversion
  const getBudgetAmountUSD = () => {
    if (!project) return 0;
    const budgetMatch = project.budget.match(/\$?([\d,]+)/g);
    if (budgetMatch && budgetMatch.length >= 2) {
      const min = parseFloat(budgetMatch[0].replace(/[$,]/g, ""));
      const max = parseFloat(budgetMatch[1].replace(/[$,]/g, ""));
      return (min + max) / 2;
    } else if (budgetMatch) {
      return parseFloat(budgetMatch[0].replace(/[$,]/g, ""));
    }
    return 0;
  };

  // Release payment to freelancer (called when project is completed)
  const releasePayment = async () => {
    if (!project || project.paymentStatus !== "escrow") return;

    try {
      const escrowAmount = project.escrowAmount || 0;

      // Update project payment status
      await updateDoc(doc(db, "projects", projectId), {
        paymentStatus: "released",
        releasedAt: serverTimestamp(),
      });

      // Update freelancer's earnings
      const freelancerRef = doc(db, "users", project.freelancerId);
      const freelancerDoc = await getDoc(freelancerRef);
      
      if (freelancerDoc.exists()) {
        const currentEarnings = freelancerDoc.data().totalEarnings || 0;
        const earningsHistory = freelancerDoc.data().earningsHistory || [];
        
        await updateDoc(freelancerRef, {
          totalEarnings: currentEarnings + escrowAmount,
          earningsHistory: [...earningsHistory, {
            projectId: projectId,
            projectTitle: project.jobTitle,
            clientName: project.clientName,
            amount: escrowAmount,
            releasedAt: serverTimestamp(),
          }],
        });
      }

      // Update transaction record
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("projectId", "==", projectId),
        where("type", "==", "escrow")
      );
      
      const transactionSnap = await getDoc(doc(db, "transactions", projectId));
      // Update via query would be better but for simplicity we'll add a new release transaction
      await addDoc(collection(db, "transactions"), {
        projectId: projectId,
        projectTitle: project.jobTitle,
        clientId: project.clientId,
        clientName: project.clientName,
        freelancerId: project.freelancerId,
        freelancerName: project.freelancerName,
        amount: escrowAmount,
        type: "release",
        status: "completed",
        createdAt: serverTimestamp(),
      });

      // Add system message
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        content: `🎉 Payment of $${escrowAmount.toLocaleString()} has been released to ${project.freelancerName}. Thank you for using TrustHire!`,
        type: "system",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error releasing payment:", error);
    }
  };

  // Update stage (freelancer only)
  const updateStage = async (stageIndex: number, newStatus: "in-progress" | "completed") => {
    if (!project || userRole !== "freelancer" || !project.stages || !Array.isArray(project.stages)) return;

    setUpdatingStage(true);
    try {
      const updatedStages = [...project.stages];
      updatedStages[stageIndex].status = newStatus;

      if (newStatus === "completed") {
        updatedStages[stageIndex].completedAt = Timestamp.now();

        // Start next stage if available
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

      // Check if all stages are completed
      if (newStatus === "completed" && stageIndex === updatedStages.length - 1) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "projects", projectId), updateData);

      // If project is completed, release payment
      if (newStatus === "completed" && stageIndex === updatedStages.length - 1) {
        await releasePayment();
      }

      // Add system message
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "freelancer",
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

  // Submit rating (client only)
  const submitRating = async () => {
    if (!project || userRole !== "client" || ratingStars === 0) return;

    setSubmittingRating(true);
    try {
      // Update project with rating
      await updateDoc(doc(db, "projects", projectId), {
        rating: {
          stars: ratingStars,
          feedback: ratingFeedback.trim(),
          ratedAt: serverTimestamp(),
        },
      });

      // Update freelancer's profile with the new rating
      const freelancerRef = doc(db, "users", project.freelancerId);
      const freelancerDoc = await getDoc(freelancerRef);
      
      if (freelancerDoc.exists()) {
        const freelancerData = freelancerDoc.data();
        const currentRatings = freelancerData.ratings || [];
        const newRating = {
          projectId: projectId,
          projectTitle: project.jobTitle,
          clientId: project.clientId,
          clientName: project.clientName,
          stars: ratingStars,
          feedback: ratingFeedback.trim(),
          ratedAt: serverTimestamp(),
        };
        
        await updateDoc(freelancerRef, {
          ratings: [...currentRatings, newRating],
          averageRating: calculateAverageRating([...currentRatings, newRating]),
          totalReviews: currentRatings.length + 1,
        });
      }

      // Add system message about rating
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System",
        senderRole: "client",
        content: `⭐ ${userName} rated this project ${ratingStars} star${ratingStars > 1 ? "s" : ""}.`,
        type: "system",
        createdAt: serverTimestamp(),
      });

      // Add payment credited message for freelancer
      const escrowAmount = project.escrowAmount || 0;
      if (escrowAmount > 0) {
        await addDoc(collection(db, "projects", projectId, "messages"), {
          senderId: "system",
          senderName: "System",
          senderRole: "system",
          content: `💰 $${escrowAmount.toLocaleString()} has been credited to ${project.freelancerName}'s account. Thank you for using TrustHire!`,
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

  // Calculate average rating
  const calculateAverageRating = (ratings: { stars: number }[]) => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.stars, 0);
    return Math.round((total / ratings.length) * 10) / 10;
  };

  // Format timestamp
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

  // Calculate progress percentage
  const getProgress = () => {
    if (!project || !project.stages || !Array.isArray(project.stages) || project.stages.length === 0) return 0;
    const completed = project.stages.filter((s) => s.status === "completed").length;
    return Math.round((completed / project.stages.length) * 100);
  };

  // Safe stages getter
  const getStages = () => {
    if (!project || !project.stages || !Array.isArray(project.stages)) {
      return [
        { name: "Planning & Setup", description: "Initial project setup", status: "pending" as const },
        { name: "Development", description: "Main development work", status: "pending" as const },
        { name: "Testing & Delivery", description: "Final testing and handover", status: "pending" as const },
      ];
    }
    return project.stages;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <p className="text-neutral-600 dark:text-neutral-400">Project not found</p>
      </div>
    );
  }

  const hasUserAgreed = userRole === "client" ? project.clientAgreed : project.freelancerAgreed;
  const hasOtherAgreed = userRole === "client" ? project.freelancerAgreed : project.clientAgreed;
  const bothAgreed = project.clientAgreed && project.freelancerAgreed;

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Left Panel - Project Info & Tabs */}
      <div className="w-80 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => router.push(userRole === "client" ? "/client/dashboard" : "/freelancer/dashboard")}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
            {project.jobTitle}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {userRole === "client" ? `Freelancer: ${project.freelancerName}` : `Client: ${project.clientName}`}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                project.status === "pending-agreement"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                  : project.status === "pending-payment"
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
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
                : project.status === "payment-secured"
                ? "Payment Secured"
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
            <span className="text-sm font-semibold text-orange-500">{project.budget}</span>
          </div>
          {bothAgreed && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-500">Progress</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{getProgress()}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
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
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <IconFileText className="w-5 h-5" />
            Agreement
            {!bothAgreed && (
              <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeTab === "chat"
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
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
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
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
                {/* Agreement Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">Project Agreement</h2>
                  <p className="text-orange-100">
                    Both parties must agree to the terms before the project can begin
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
                      Freelancer: {project.freelancerAgreed ? "Agreed" : "Pending"}
                    </div>
                  </div>
                </div>

                {/* Agreement Content */}
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                      Project Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Project Title</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{project.jobTitle}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Client</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{project.clientName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Freelancer</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{project.freelancerName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <span className="text-neutral-500">Budget</span>
                        <span className="text-orange-500 font-semibold">{project.budget}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                      Project Stages
                    </h3>
                    <div className="space-y-3">
                      {project.stages.map((stage, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-500 font-semibold text-sm">{index + 1}</span>
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
                      <p>1. The freelancer agrees to complete the project as described within the agreed timeline.</p>
                      <p>2. The client agrees to provide necessary materials and feedback in a timely manner.</p>
                      <p>3. Payment will be processed upon successful completion of each stage as agreed.</p>
                      <p>4. Both parties agree to communicate professionally and resolve disputes amicably.</p>
                      <p>5. Either party may cancel the project with 7 days notice, subject to partial payment for completed work.</p>
                    </div>
                  </div>

                  {/* Sign Button */}
                  {!hasUserAgreed ? (
                    <div className="pt-4">
                      <button
                        onClick={signAgreement}
                        disabled={agreeing}
                        className="w-full py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                      <p className="text-center text-xs text-neutral-500 mt-3">
                        By clicking &quot;I Agree&quot;, you accept all terms and conditions above
                      </p>
                    </div>
                  ) : !hasOtherAgreed ? (
                    <div className="pt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 flex items-start gap-3">
                      <IconAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">
                          Waiting for {userRole === "client" ? "freelancer" : "client"} to agree
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                          You have signed the agreement. The project will begin once the other party signs.
                        </p>
                      </div>
                    </div>
                  ) : project.status === "pending-payment" ? (
                    // Both agreed, waiting for payment
                    userRole === "client" ? (
                      <div className="pt-4 space-y-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-start gap-3">
                          <IconWallet className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-700 dark:text-orange-400">
                              Secure Payment Required
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                              Both parties have agreed. Please deposit the project budget into escrow to start the project. The funds will be securely held and released to the freelancer upon project completion.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                        >
                          <IconLock className="w-5 h-5" />
                          Secure Payment & Start Project
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
                            Both parties have agreed. Waiting for the client to secure the payment in escrow. Once the payment is deposited, the project will begin and you&apos;ll receive the funds upon completion.
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
                            ${project.escrowAmount?.toLocaleString()} is safely held in escrow. The project is now active!
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
                              <p className="text-lg font-bold text-neutral-900 dark:text-white">${project.escrowAmount?.toLocaleString()}</p>
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
                          ${project.escrowAmount?.toLocaleString()} has been released to {project.freelancerName}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
                      <IconCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Agreement Complete!
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                          Both parties have agreed. The project is now active.
                        </p>
                      </div>
                    </div>
                  )}
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
                                  ? "bg-orange-500 text-white rounded-br-sm"
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
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-neutral-900 dark:text-white placeholder-neutral-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50"
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
                  Project Stages
                </h2>

                <div className="space-y-6">
                  {getStages().map((stage, index) => (
                    <div key={index} className="relative">
                      {/* Connector Line */}
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
                        {/* Stage Indicator */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            stage.status === "completed"
                              ? "bg-green-500"
                              : stage.status === "in-progress"
                              ? "bg-orange-500"
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

                        {/* Stage Content */}
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

                            {/* Status / Actions */}
                            <div className="flex items-center gap-2">
                              {stage.status === "completed" ? (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                  Completed
                                </span>
                              ) : stage.status === "in-progress" ? (
                                <>
                                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                                    In Progress
                                  </span>
                                  {userRole === "freelancer" && (
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
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
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
                          Project Completed! 🎉
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          All stages have been successfully completed.
                        </p>
                      </div>
                    </div>

                    {/* Rating Section */}
                    {project.rating ? (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-orange-700 dark:text-orange-400">Your Rating</p>
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
                          <p className="text-sm text-orange-600 dark:text-orange-300 italic">
                            &quot;{project.rating.feedback}&quot;
                          </p>
                        )}
                      </div>
                    ) : userRole === "client" ? (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="w-full p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <IconStar className="w-5 h-5" />
                        Rate This Project
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
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <h2 className="text-xl font-bold">Rate Your Experience</h2>
              <p className="text-orange-100 text-sm mt-1">
                How was your experience working with {project?.freelancerName}?
              </p>
            </div>

            <div className="p-6">
              {/* Star Rating */}
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

              {/* Rating Label */}
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

              {/* Feedback */}
              <textarea
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Share your experience (optional)..."
                className="w-full p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-neutral-900 dark:text-white placeholder-neutral-400 resize-none"
                rows={4}
              />

              {/* Actions */}
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
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Payment Modal - Choose Payment Method */}
      {showPaymentModal && project && !showCryptoPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <IconLock className="w-8 h-8" />
                  <h2 className="text-xl font-bold">Choose Payment Method</h2>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentMethod(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>
              <p className="text-orange-100 text-sm">
                Select how you&apos;d like to secure payment for this project
              </p>
            </div>

            <div className="p-6">
              {/* Payment Summary */}
              <div className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-neutral-600 dark:text-neutral-400">Project</span>
                  <span className="text-neutral-900 dark:text-white font-medium text-right max-w-[200px] truncate">{project.jobTitle}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-neutral-600 dark:text-neutral-400">Freelancer</span>
                  <span className="text-neutral-900 dark:text-white font-medium">{project.freelancerName}</span>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Budget</span>
                    <span className="text-orange-500 font-bold">{project.budget}</span>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Select Payment Method
                </p>
                
                {/* Crypto Payment Option */}
                <button
                  onClick={() => setPaymentMethod("crypto")}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentMethod === "crypto"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    paymentMethod === "crypto" ? "bg-orange-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                  }`}>
                    <IconCurrencyEthereum className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        Crypto (MetaMask)
                      </span>
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      Pay with ETH via MetaMask wallet. Transparent blockchain escrow.
                    </p>
                  </div>
                  {paymentMethod === "crypto" && (
                    <IconCheck className="w-5 h-5 text-orange-500" />
                  )}
                </button>

                {/* Traditional Escrow Option */}
                <button
                  onClick={() => setPaymentMethod("escrow")}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentMethod === "escrow"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    paymentMethod === "escrow" ? "bg-orange-500 text-white" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                  }`}>
                    <IconWallet className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Traditional Escrow
                    </span>
                    <p className="text-sm text-neutral-500 mt-1">
                      Standard escrow payment. Funds held by TrustHire until completion.
                    </p>
                  </div>
                  {paymentMethod === "escrow" && (
                    <IconCheck className="w-5 h-5 text-orange-500" />
                  )}
                </button>
              </div>

              {/* Escrow Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <IconLock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-400">
                      {paymentMethod === "crypto" ? "Blockchain Escrow" : "How Escrow Works"}
                    </p>
                    <ul className="text-blue-600 dark:text-blue-500 mt-2 space-y-1">
                      {paymentMethod === "crypto" ? (
                        <>
                          <li>• Payment secured via smart contract on blockchain</li>
                          <li>• Full transparency with transaction verification</li>
                          <li>• Automatic release upon project completion</li>
                          <li>• Lower fees compared to traditional payments</li>
                        </>
                      ) : (
                        <>
                          <li>• Your payment is held securely by TrustHire</li>
                          <li>• Freelancer receives confirmation of secured funds</li>
                          <li>• Payment is released upon project completion</li>
                          <li>• Full protection for both parties</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentMethod(null);
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (paymentMethod === "crypto") {
                      setShowCryptoPayment(true);
                    } else if (paymentMethod === "escrow") {
                      processPayment();
                    }
                  }}
                  disabled={!paymentMethod || processingPayment}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "crypto" ? (
                        <IconCurrencyEthereum className="w-4 h-4" />
                      ) : (
                        <IconWallet className="w-4 h-4" />
                      )}
                      {paymentMethod === "crypto" ? "Pay with Crypto" : "Pay with Escrow"}
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-neutral-500 mt-4">
                By proceeding, you agree to TrustHire&apos;s escrow terms and conditions
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Crypto Payment Modal */}
      {showCryptoPayment && project && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CryptoPayment
              amount={getBudgetAmountUSD()}
              projectTitle={project.jobTitle}
              freelancerName={project.freelancerName}
              onSuccess={handleCryptoPaymentSuccess}
              onCancel={() => {
                setShowCryptoPayment(false);
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
