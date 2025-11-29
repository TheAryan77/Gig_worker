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
  addDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
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

  IconMapPin,
  IconClock,
} from "@tabler/icons-react";

interface Job {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  jobCategory: string;
  workerCategory: string;
  budget: string;
  minBudget: number;
  maxBudget: number;
  duration: string;
  location: string;
  status: string;
  proposals: number;
  createdAt: Timestamp;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  budget: string;
  status: string;
  projectId?: string;
  appliedAt: Timestamp;
}

interface ActiveProject {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  budget: string;
  progress: number;
  projectId?: string;
  agreementSigned: boolean;
  startedAt: Timestamp;
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

export default function WorkerDashboard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "applied" | "active">("browse");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [workerCategory, setWorkerCategory] = useState<string>("");
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [pendingEarnings, setPendingEarnings] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<{
    hourlyRate?: number;
    experience?: string;
    availability?: string;
    skills?: string[];
    location?: string;
  } | null>(null);
  
  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Auth and user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || "Worker");
          setWorkerCategory(userData.workerCategory || "");
          setTotalEarnings(userData.totalEarnings || 0);
          setUserProfile({
            hourlyRate: userData.hourlyRate,
            experience: userData.experience,
            availability: userData.availability,
            skills: userData.skills,
            location: userData.location,
          });
        }
      } else {
        router.push("/choice");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch pending earnings
  useEffect(() => {
    if (!userId) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("freelancerId", "==", userId),
      where("paymentStatus", "==", "escrow")
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      let pending = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        pending += data.escrowAmount || 0;
      });
      setPendingEarnings(pending);
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch worker jobs that match the worker's category
  useEffect(() => {
    if (!workerCategory) return;

    console.log("Fetching worker jobs for category:", workerCategory);
    
    const jobsRef = collection(db, "jobs");

    const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
      const jobsData: Job[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Only show open worker jobs that match the worker's category
        if (
          data.status === "open" && 
          data.jobCategory === "worker" &&
          data.workerCategory === workerCategory
        ) {
          jobsData.push({ id: docSnap.id, ...data } as Job);
        }
      });
      // Sort by createdAt
      jobsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      console.log("Worker jobs found:", jobsData.length);
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please refresh the page.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workerCategory]);

  // Fetch user's applications
  useEffect(() => {
    if (!userId) return;

    const applicationsQuery = query(
      collection(db, "applications"),
      where("freelancerId", "==", userId)
    );

    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const applicationsData: Application[] = [];
      snapshot.forEach((doc) => {
        applicationsData.push({ id: doc.id, ...doc.data() } as Application);
      });
      applicationsData.sort((a, b) => {
        if (!a.appliedAt || !b.appliedAt) return 0;
        return b.appliedAt.seconds - a.appliedAt.seconds;
      });
      setApplications(applicationsData);
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch active projects
  useEffect(() => {
    if (!userId) return;

    const projectsQuery = query(
      collection(db, "applications"),
      where("freelancerId", "==", userId)
    );

    const unsubscribe = onSnapshot(projectsQuery, async (snapshot) => {
      const projectsData: ActiveProject[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.status === "approved") {
          let agreementSigned = false;
          if (data.projectId) {
            try {
              const projectDoc = await getDoc(doc(db, "projects", data.projectId));
              if (projectDoc.exists()) {
                const projectData = projectDoc.data();
                agreementSigned = projectData.clientAgreed && projectData.freelancerAgreed;
              }
            } catch (err) {
              console.error("Error fetching project:", err);
            }
          }
          projectsData.push({
            id: docSnap.id,
            jobId: data.jobId,
            jobTitle: data.jobTitle,
            clientName: data.clientName,
            budget: data.budget,
            progress: data.progress || 0,
            projectId: data.projectId,
            agreementSigned,
            startedAt: data.approvedAt,
          });
        }
      }
      setActiveProjects(projectsData);
    });

    return () => unsubscribe();
  }, [userId]);

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    return job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Check if user has already applied
  const hasApplied = (jobId: string) => {
    return applications.some(app => app.jobId === jobId);
  };

  // Get application status
  const getApplicationStatus = (jobId: string) => {
    const application = applications.find(app => app.jobId === jobId);
    return application?.status || null;
  };

  // Apply to a job
  const handleApply = async (job: Job) => {
    if (!userId || !userProfile) {
      setError("Please complete your profile before applying");
      return;
    }

    setApplyingJobId(job.id);
    setError("");

    try {
      await addDoc(collection(db, "applications"), {
        jobId: job.id,
        jobTitle: job.title,
        clientId: job.clientId,
        clientName: job.clientName,
        freelancerId: userId,
        freelancerName: userName,
        freelancerProfile: {
          hourlyRate: userProfile.hourlyRate,
          experience: userProfile.experience,
          availability: userProfile.availability,
          skills: userProfile.skills,
          location: userProfile.location,
          workerCategory: workerCategory,
        },
        budget: job.budget,
        status: "pending",
        appliedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "jobs", job.id), {
        proposals: increment(1),
      });

      setSelectedJob(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Error applying to job:", error);
      setError(error.message || "Failed to apply. Please try again.");
    } finally {
      setApplyingJobId(null);
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

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const sidebarLinks = [
    {
      label: "Browse Jobs",
      href: "#",
      icon: <IconBriefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "My Applications",
      href: "#",
      icon: <IconFileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Active Jobs",
      href: "#",
      icon: <IconChecklist className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Earnings",
      href: "/worker/earnings",
      icon: <IconCash className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
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
          <p className="text-neutral-600 dark:text-neutral-400">Loading jobs...</p>
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

            {/* Main Links */}
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (link.label === "Browse Jobs") setActiveTab("browse");
                    else if (link.label === "My Applications") setActiveTab("applied");
                    else if (link.label === "Active Jobs") setActiveTab("active");
                    else if (link.href !== "#") router.push(link.href);
                  }}
                  className={`cursor-pointer rounded-lg px-2 py-2 transition-colors ${
                    (link.label === "Browse Jobs" && activeTab === "browse") ||
                    (link.label === "My Applications" && activeTab === "applied") ||
                    (link.label === "Active Jobs" && activeTab === "active")
                      ? "bg-green-100 dark:bg-green-900/30"
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
                {activeTab === "browse" && "Browse Jobs"}
                {activeTab === "applied" && "My Applications"}
                {activeTab === "active" && "Active Jobs"}
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                {activeTab === "browse" && `${jobs.length} ${formatCategoryName(workerCategory)} jobs available`}
                {activeTab === "applied" && "Track your job applications"}
                {activeTab === "active" && "Manage your ongoing work"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              {error}
              <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IconBriefcase className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{jobs.length}</p>
                  <p className="text-xs text-neutral-500">Available Jobs</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <IconFileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{applications.length}</p>
                  <p className="text-xs text-neutral-500">Applied</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <IconChecklist className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{activeProjects.length}</p>
                  <p className="text-xs text-neutral-500">Active Jobs</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IconCash className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">₹{totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">Total Earned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          {activeTab === "browse" && (
            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search jobs by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Job Listings */}
          {activeTab === "browse" && (
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="text-5xl mb-4">{categoryIcons[workerCategory] || "👷"}</div>
                  <p className="text-neutral-600 dark:text-neutral-400">No {formatCategoryName(workerCategory)} jobs available</p>
                  <p className="text-sm text-neutral-500 mt-1">Check back later for new opportunities!</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:border-green-500 transition-all cursor-pointer ${
                      hasApplied(job.id) ? "opacity-70" : ""
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{categoryIcons[job.workerCategory] || "👷"}</span>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {job.title}
                          </h3>
                          {hasApplied(job.id) && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              getApplicationStatus(job.id) === "approved"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : getApplicationStatus(job.id) === "rejected"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                            }`}>
                              {getApplicationStatus(job.id) === "approved" ? "Approved" :
                               getApplicationStatus(job.id) === "rejected" ? "Rejected" : "Pending"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mb-3">
                          Posted by <span className="text-neutral-700 dark:text-neutral-300">{job.clientName}</span> • {formatTime(job.createdAt)}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <IconMapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <IconClock className="w-4 h-4" />
                            {job.duration}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 min-w-[150px]">
                        <p className="text-lg font-bold text-green-500">{job.budget}</p>
                        <p className="text-xs text-neutral-400">{job.proposals} applications</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Applied Jobs */}
          {activeTab === "applied" && (
            <div className="grid gap-4">
              {applications.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                    <IconFileText className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">No applications yet</p>
                  <p className="text-sm text-neutral-500 mt-1">Browse jobs and start applying!</p>
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                          {app.jobTitle}
                        </h3>
                        <p className="text-sm text-neutral-500 mb-2">Client: {app.clientName}</p>
                        <p className="text-xs text-neutral-400">Applied {formatTime(app.appliedAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          app.status === "approved"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : app.status === "rejected"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        }`}>
                          {app.status === "approved" ? "Approved" :
                           app.status === "rejected" ? "Rejected" : "Pending Review"}
                        </span>
                        <p className="text-lg font-bold text-green-500 mt-2">{app.budget}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Jobs */}
          {activeTab === "active" && (
            <div className="grid gap-4">
              {activeProjects.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                    <IconChecklist className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">No active jobs</p>
                  <p className="text-sm text-neutral-500 mt-1">Once a client hires you, it will appear here!</p>
                </div>
              ) : (
                activeProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                          {project.jobTitle}
                        </h3>
                        <p className="text-sm text-neutral-500">Client: {project.clientName}</p>
                      </div>
                      {!project.agreementSigned ? (
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded-full animate-pulse">
                          Agreement Pending
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                    {project.agreementSigned ? (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">Progress</span>
                          <span className="text-neutral-900 dark:text-white font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          ⚠️ Please sign the agreement to start working on this job
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-neutral-500">Started {formatTime(project.startedAt)}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-green-500">{project.budget}</p>
                        {project.projectId && (
                          <button
                            onClick={() => router.push(`/project/${project.projectId}`)}
                            className={`px-4 py-2 text-white text-sm rounded-lg transition-all ${
                              !project.agreementSigned 
                                ? "bg-yellow-500 hover:bg-yellow-600 animate-pulse" 
                                : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {!project.agreementSigned ? "Sign Agreement" : "View Job"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{categoryIcons[selectedJob.workerCategory] || "👷"}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                      {selectedJob.title}
                    </h2>
                    <p className="text-neutral-500">
                      Posted by {selectedJob.clientName} • {formatTime(selectedJob.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">Budget</p>
                  <p className="text-lg font-bold text-green-500">{selectedJob.budget}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">Duration</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{selectedJob.duration}</p>
                </div>
              </div>

              {selectedJob.location && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <IconMapPin className="w-5 h-5" />
                    <span className="font-medium">Location:</span>
                    <span>{selectedJob.location}</span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Description</h3>
                <p className="text-neutral-600 dark:text-neutral-400">{selectedJob.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-500">{selectedJob.proposals} workers have applied</p>
                {hasApplied(selectedJob.id) ? (
                  <button
                    disabled
                    className="px-6 py-3 bg-neutral-300 dark:bg-neutral-700 text-neutral-500 rounded-xl cursor-not-allowed"
                  >
                    Already Applied
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(selectedJob)}
                    disabled={applyingJobId === selectedJob.id}
                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    {applyingJobId === selectedJob.id ? "Applying..." : "Apply Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
