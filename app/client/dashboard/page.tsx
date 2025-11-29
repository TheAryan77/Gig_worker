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
  updateDoc,
  addDoc,
  getDoc,
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
  IconPlus,
  IconHome,
  IconLogout,
  IconCash,

  IconUsers,
  IconStarFilled,
} from "@tabler/icons-react";

interface Job {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  profession: string;
  techStack: string[];
  budget: string;
  duration: string;
  status: string;
  proposals: number;
  projectId?: string;
  assignedTo?: {
    freelancerId: string;
    freelancerName: string;
  };
  createdAt: Timestamp;
}

interface Applicant {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerProfile: {
    hourlyRate?: number;
    experience?: string;
    responseTime?: string;
    techStack?: string[];
  };
  status: string;
  appliedAt: Timestamp;
}

interface CompletedProject {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerName: string;
  budget: string;
  escrowAmount?: number;
  paymentStatus?: "pending" | "escrow" | "released";
  completedAt?: Timestamp;
  rating?: {
    stars: number;
    feedback: string;
    ratedAt: Timestamp;
  };
}

export default function ClientDashboard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posted" | "in-progress" | "completed">("posted");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicants, setShowApplicants] = useState(false);
  
  // User state
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState<string | null>(null);

  // Auth
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

  // Fetch client's jobs
  useEffect(() => {
    if (!userId) return;

    const jobsQuery = query(
      collection(db, "jobs"),
      where("clientId", "==", userId)
    );

    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData: Job[] = [];
      snapshot.forEach((doc) => {
        jobsData.push({ id: doc.id, ...doc.data() } as Job);
      });
      // Sort by createdAt client-side
      jobsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch applicants for client's jobs
  useEffect(() => {
    if (!userId) return;

    const applicantsQuery = query(
      collection(db, "applications"),
      where("clientId", "==", userId)
    );

    const unsubscribe = onSnapshot(applicantsQuery, (snapshot) => {
      const applicantsData: Applicant[] = [];
      snapshot.forEach((doc) => {
        applicantsData.push({ id: doc.id, ...doc.data() } as Applicant);
      });
      // Sort by appliedAt client-side
      applicantsData.sort((a, b) => {
        if (!a.appliedAt || !b.appliedAt) return 0;
        return b.appliedAt.seconds - a.appliedAt.seconds;
      });
      setApplicants(applicantsData);
    }, (error) => {
      console.error("Error fetching applicants:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch completed projects with ratings
  useEffect(() => {
    if (!userId) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("clientId", "==", userId)
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData: CompletedProject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === "completed") {
          projectsData.push({
            id: docSnap.id,
            jobId: data.jobId,
            jobTitle: data.jobTitle,
            freelancerName: data.freelancerName,
            budget: data.budget,
            escrowAmount: data.escrowAmount,
            paymentStatus: data.paymentStatus,
            completedAt: data.completedAt,
            rating: data.rating,
          });
        }
      });
      // Sort by completedAt client-side
      projectsData.sort((a, b) => {
        if (!a.completedAt || !b.completedAt) return 0;
        return b.completedAt.seconds - a.completedAt.seconds;
      });
      setCompletedProjects(projectsData);
    }, (error) => {
      console.error("Error fetching completed projects:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  // Filter jobs by status
  const openJobs = jobs.filter(job => job.status === "open");
  const inProgressJobs = jobs.filter(job => job.status === "in-progress");
  const completedJobs = jobs.filter(job => job.status === "completed");

  // Get applicants for a specific job
  const getJobApplicants = (jobId: string) => {
    return applicants.filter(app => app.jobId === jobId && app.status === "pending");
  };

  // Count total pending proposals
  const totalPendingProposals = applicants.filter(app => app.status === "pending").length;

  // Handle hiring a freelancer
  const handleHire = async (applicant: Applicant) => {
    setHiringId(applicant.id);

    try {
      // Get job details for the project
      const jobDoc = await getDoc(doc(db, "jobs", applicant.jobId));
      const jobData = jobDoc.data();

      // Get client name
      let clientName = "Client";
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          clientName = userDoc.data().name || "Client";
        }
      }

      // Create a project with pending agreement status
      const projectRef = await addDoc(collection(db, "projects"), {
        jobId: applicant.jobId,
        jobTitle: applicant.jobTitle,
        description: jobData?.description || "",
        clientId: userId,
        clientName: clientName,
        freelancerId: applicant.freelancerId,
        freelancerName: applicant.freelancerName,
        budget: jobData?.budget || "",
        status: "pending-agreement",
        clientAgreed: false,
        freelancerAgreed: false,
        currentStage: 0,
        stages: [
          {
            name: "Planning & Setup",
            description: "Initial project setup, requirements gathering, and planning phase",
            status: "pending",
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
        ],
        createdAt: serverTimestamp(),
      });

      // Update application status to approved with project reference
      await updateDoc(doc(db, "applications", applicant.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        projectId: projectRef.id,
        progress: 0,
      });

      // Update job status to in-progress
      await updateDoc(doc(db, "jobs", applicant.jobId), {
        status: "in-progress",
        projectId: projectRef.id,
        assignedTo: {
          freelancerId: applicant.freelancerId,
          freelancerName: applicant.freelancerName,
        },
        updatedAt: serverTimestamp(),
      });

      // Reject other applicants for this job
      const otherApplicants = applicants.filter(
        app => app.jobId === applicant.jobId && app.id !== applicant.id && app.status === "pending"
      );
      
      for (const other of otherApplicants) {
        await updateDoc(doc(db, "applications", other.id), {
          status: "rejected",
          rejectedAt: serverTimestamp(),
        });
      }

      setShowApplicants(false);
      setSelectedJob(null);

      // Redirect to the project page for agreement
      router.push(`/project/${projectRef.id}`);
    } catch (error) {
      console.error("Error hiring freelancer:", error);
    } finally {
      setHiringId(null);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const sidebarLinks = [
    {
      label: "Posted Jobs",
      href: "#",
      icon: <IconBriefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "In Progress",
      href: "#",
      icon: <IconChecklist className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Completed",
      href: "#",
      icon: <IconFileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Post New Job",
      href: "/client/post-job",
      icon: <IconPlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Payments",
      href: "/client/payments",
      icon: <IconCash className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
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
          <p className="text-neutral-600 dark:text-neutral-400">Loading dashboard...</p>
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
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="font-bold text-xl text-neutral-900 dark:text-white whitespace-pre"
              >
                TrustHire
              </motion.span>
            </div>

            {/* Main Links */}
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (link.label === "Posted Jobs") setActiveTab("posted");
                    else if (link.label === "In Progress") setActiveTab("in-progress");
                    else if (link.label === "Completed") setActiveTab("completed");
                    else if (link.href !== "#") router.push(link.href);
                  }}
                  className={`cursor-pointer rounded-lg px-2 py-2 transition-colors ${
                    (link.label === "Posted Jobs" && activeTab === "posted") ||
                    (link.label === "In Progress" && activeTab === "in-progress") ||
                    (link.label === "Completed" && activeTab === "completed")
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <SidebarLink link={link} />
                </div>
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
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {activeTab === "posted" && "Posted Jobs"}
                {activeTab === "in-progress" && "In Progress"}
                {activeTab === "completed" && "Completed Projects"}
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                {activeTab === "posted" && "Manage your job postings and review applicants"}
                {activeTab === "in-progress" && "Track your ongoing projects"}
                {activeTab === "completed" && "View your completed projects"}
              </p>
            </div>
            <button
              onClick={() => router.push("/client/post-job")}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2"
            >
              <IconPlus className="w-5 h-5" />
              Post New Job
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <IconBriefcase className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{openJobs.length}</p>
                  <p className="text-xs text-neutral-500">Open Jobs</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <IconUsers className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalPendingProposals}</p>
                  <p className="text-xs text-neutral-500">Pending Proposals</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IconChecklist className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{inProgressJobs.length}</p>
                  <p className="text-xs text-neutral-500">In Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IconCash className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{completedProjects.length}</p>
                  <p className="text-xs text-neutral-500">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Posted Jobs */}
          {activeTab === "posted" && (
            <div className="grid gap-4">
              {openJobs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                    <IconBriefcase className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">No open jobs yet</p>
                  <button
                    onClick={() => router.push("/client/post-job")}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all"
                  >
                    Post Your First Job
                  </button>
                </div>
              ) : (
                openJobs.map((job) => {
                  const jobApplicants = getJobApplicants(job.id);
                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                              {job.title}
                            </h3>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                              Open
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 mb-3">
                            Looking for: <span className="text-neutral-700 dark:text-neutral-300">{job.profession}</span> • Posted {formatTime(job.createdAt)}
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                            {job.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(job.techStack || []).map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 min-w-[180px]">
                          <p className="text-lg font-bold text-orange-500">{job.budget}</p>
                          <p className="text-sm text-neutral-500">{job.duration}</p>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowApplicants(true);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                          >
                            <IconUsers className="w-4 h-4" />
                            View Applicants ({jobApplicants.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* In Progress Jobs */}
          {activeTab === "in-progress" && (
            <div className="grid gap-4">
              {inProgressJobs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <p className="text-neutral-600 dark:text-neutral-400">No projects in progress</p>
                  <p className="text-sm text-neutral-500 mt-1">Hire a freelancer to get started!</p>
                </div>
              ) : (
                inProgressJobs.map((job) => {
                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            Assigned to: <span className="text-neutral-700 dark:text-neutral-300">{job.assignedTo?.freelancerName || "Unknown"}</span>
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                          In Progress
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">Progress</span>
                          <span className="text-neutral-900 dark:text-white font-medium">0%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: "0%" }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {(job.techStack || []).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-orange-500">{job.budget}</p>
                          {job.projectId && (
                            <button
                              onClick={() => router.push(`/project/${job.projectId}`)}
                              className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-all"
                            >
                              View Project
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Completed Jobs */}
          {activeTab === "completed" && (
            <div className="grid gap-4">
              {completedProjects.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                    <IconChecklist className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">No completed projects yet</p>
                </div>
              ) : (
                completedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                          {project.jobTitle}
                        </h3>
                        <p className="text-sm text-neutral-500">Freelancer: {project.freelancerName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                          Completed
                        </span>
                      </div>
                    </div>

                    {/* Payment Status */}
                    {project.paymentStatus === "released" && project.escrowAmount && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <IconCash className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">Payment Released</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">${project.escrowAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Rating Display */}
                    {project.rating ? (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Your Rating:</span>
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
                          <span className="text-sm text-neutral-500">({project.rating.stars}/5)</span>
                        </div>
                        {project.rating.feedback && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                            &quot;{project.rating.feedback}&quot;
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-sm text-neutral-500">You haven&apos;t rated this project yet</span>
                        <button
                          onClick={() => router.push(`/project/${project.id}`)}
                          className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2"
                        >
                          <IconStarFilled className="w-4 h-4" />
                          Rate Project
                        </button>
                      </div>
                    )}

                    {/* View Project Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
                      >
                        View Project Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Applicants Modal */}
      {showApplicants && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                    Applicants for &quot;{selectedJob.title}&quot;
                  </h2>
                  <p className="text-neutral-500">
                    {getJobApplicants(selectedJob.id).length} freelancers have applied
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowApplicants(false);
                    setSelectedJob(null);
                  }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {getJobApplicants(selectedJob.id).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No applicants yet</p>
                  <p className="text-sm text-neutral-400 mt-1">Wait for freelancers to apply to your job</p>
                </div>
              ) : (
                getJobApplicants(selectedJob.id).map((applicant) => (
                  <div
                    key={applicant.id}
                    className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <span className="text-orange-500 font-semibold text-lg">
                            {applicant.freelancerName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">{applicant.freelancerName}</h3>
                          <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                            {applicant.freelancerProfile?.hourlyRate && (
                              <span>${applicant.freelancerProfile.hourlyRate}/hr</span>
                            )}
                            {applicant.freelancerProfile?.experience && (
                              <span>{applicant.freelancerProfile.experience}</span>
                            )}
                          </div>
                          {applicant.freelancerProfile?.responseTime && (
                            <p className="text-sm text-neutral-500 mt-1">
                              Response time: {applicant.freelancerProfile.responseTime}
                            </p>
                          )}
                          {applicant.freelancerProfile?.techStack && applicant.freelancerProfile.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {applicant.freelancerProfile.techStack.slice(0, 5).map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {applicant.freelancerProfile.techStack.length > 5 && (
                                <span className="text-xs text-neutral-500">
                                  +{applicant.freelancerProfile.techStack.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-neutral-400 mt-2">
                            Applied {formatTime(applicant.appliedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleHire(applicant)}
                          disabled={hiringId === applicant.id}
                          className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                          {hiringId === applicant.id ? "Hiring..." : "Hire"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
