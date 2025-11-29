"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Job category - Freelancer (Coder) or Worker
const jobCategoryOptions = [
  {
    id: "freelancer",
    name: "Freelancer (Coder)",
    description: "Hire developers, designers, data scientists for tech projects",
    icon: "💻",
  },
  {
    id: "worker",
    name: "Worker (Service)",
    description: "Hire electricians, plumbers, cleaners, painters, etc.",
    icon: "🔧",
  },
];

// Worker categories
const workerCategoryOptions = [
  { id: "electrician", name: "Electrician", icon: "⚡" },
  { id: "plumber", name: "Plumber", icon: "🔧" },
  { id: "carpenter", name: "Carpenter", icon: "🪚" },
  { id: "home-cleaner", name: "Home Cleaner", icon: "🧹" },
  { id: "painter", name: "Painter", icon: "🎨" },
  { id: "labourer", name: "General Labourer", icon: "👷" },
  { id: "gardener", name: "Gardener", icon: "🌱" },
  { id: "ac-technician", name: "AC Technician", icon: "❄️" },
  { id: "appliance-repair", name: "Appliance Repair", icon: "🔌" },
  { id: "pest-control", name: "Pest Control", icon: "🐜" },
  { id: "driver", name: "Driver", icon: "🚗" },
  { id: "security", name: "Security Guard", icon: "🛡️" },
  { id: "cook", name: "Cook / Chef", icon: "👨‍🍳" },
  { id: "tailor", name: "Tailor", icon: "🧵" },
  { id: "other", name: "Other", icon: "📋" },
];

const professionOptions = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile App Developer",
  "UI/UX Designer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Blockchain Developer",
  "Cloud Architect",
  "Security Engineer",
  "QA Engineer",
  "Technical Writer",
  "Project Manager",
  "Other"
];

const techStackOptions = [
  "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js",
  "Python", "Django", "Flask", "Java", "Spring Boot", "Go",
  "Rust", "TypeScript", "JavaScript", "PHP", "Laravel", "Ruby",
  "Ruby on Rails", "Swift", "Kotlin", "Flutter", "React Native",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "MongoDB",
  "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST API", "Solidity",
  "Web3", "Blockchain", "AI/ML", "TensorFlow", "PyTorch", "Figma",
  "Adobe XD", "Sketch", "Tailwind CSS", "SASS", "Bootstrap"
];

const durationOptions = [
  "Less than 1 week",
  "1-2 weeks",
  "2-4 weeks",
  "1-2 months",
  "2-3 months",
  "3-6 months",
  "More than 6 months"
];

const workerDurationOptions = [
  "One-time job",
  "Few hours",
  "1 day",
  "2-3 days",
  "1 week",
  "Ongoing / Regular"
];

export default function PostJob() {
  const router = useRouter();
  const [step, setStep] = useState(0); // Start at 0 for category selection
  const [userId, setUserId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Common form data
  const [jobCategory, setJobCategory] = useState<"freelancer" | "worker" | "">("");
  const [formData, setFormData] = useState({
    // Common fields
    title: "",
    description: "",
    minBudget: "",
    maxBudget: "",
    duration: "",
    additionalRequirements: "",
    location: "", // For worker jobs
    
    // Freelancer specific
    profession: "",
    customProfession: "",
    techStack: [] as string[],
    
    // Worker specific
    workerCategory: "",
    customWorkerCategory: "",
  });

  // Check if user is authenticated and get their name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const name = userDoc.data().name;
            setClientName(name || user.displayName || user.email || "Client");
          } else {
            setClientName(user.displayName || user.email || "Client");
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          setClientName(user.displayName || user.email || "Client");
        }
      } else {
        router.push("/choice");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleTechStackToggle = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!userId) {
      setError("You must be logged in to post a job");
      return;
    }

    setLoading(true);

    try {
      // Build job document based on category
      const jobData: Record<string, unknown> = {
        clientId: userId,
        clientName: clientName || "Client",
        jobCategory: jobCategory, // "freelancer" or "worker"
        title: formData.title,
        description: formData.description,
        minBudget: parseFloat(formData.minBudget),
        maxBudget: parseFloat(formData.maxBudget),
        budget: `$${formData.minBudget} - $${formData.maxBudget}`,
        duration: formData.duration,
        additionalRequirements: formData.additionalRequirements,
        status: "open",
        proposals: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (jobCategory === "freelancer") {
        jobData.profession = formData.profession === "Other" ? formData.customProfession : formData.profession;
        jobData.techStack = formData.techStack;
      } else {
        jobData.workerCategory = formData.workerCategory === "other" ? formData.customWorkerCategory : formData.workerCategory;
        jobData.location = formData.location;
      }
      
      const docRef = await addDoc(collection(db, "jobs"), jobData);
      console.log("Job posted successfully with ID:", docRef.id);

      router.push("/client/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Error posting job:", error);
      setError(error.message || "Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step validation
  const canProceedStep0 = jobCategory !== "";
  const canProceedStep1 = jobCategory === "freelancer" 
    ? formData.profession !== "" 
    : formData.workerCategory !== "";
  const canProceedStep2 = formData.title !== "" && formData.description !== "";
  const canProceedStep3 = jobCategory === "freelancer" 
    ? formData.techStack.length > 0 
    : formData.location !== "";
  const canSubmit = formData.minBudget !== "" && formData.maxBudget !== "" && formData.duration !== "";

  // Total steps based on category
  const totalSteps = 5;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Post a New <span className="text-orange-500">Job</span>
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Find the perfect {jobCategory === "worker" ? "worker" : "freelancer"} for your {jobCategory === "worker" ? "task" : "project"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {s + 1}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-1 transition-all ${
                      step > s ? "bg-orange-500" : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Step 0: Choose Job Category */}
          {step === 0 && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                What type of help do you need?
              </h2>
              <p className="text-neutral-500 mb-6">
                Choose whether you need a tech freelancer or a service worker
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {jobCategoryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setJobCategory(option.id as "freelancer" | "worker")}
                    className={`p-6 rounded-xl text-left transition-all border-2 ${
                      jobCategory === option.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-300"
                    }`}
                  >
                    <span className="text-4xl mb-3 block">{option.icon}</span>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                      {option.name}
                    </h3>
                    <p className="text-sm text-neutral-500">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    canProceedStep0
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Choose Profession (Freelancer) or Worker Category */}
          {step === 1 && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {jobCategory === "freelancer" 
                  ? "What type of professional do you need?" 
                  : "What type of worker do you need?"}
              </h2>
              <p className="text-neutral-500 mb-6">
                {jobCategory === "freelancer"
                  ? "Select the profession that best matches your project requirements"
                  : "Select the service category for your job"}
              </p>

              {jobCategory === "freelancer" ? (
                // Freelancer profession options
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {professionOptions.map((profession) => (
                      <button
                        key={profession}
                        type="button"
                        onClick={() => setFormData({ ...formData, profession })}
                        className={`p-4 rounded-xl text-sm font-medium transition-all text-left ${
                          formData.profession === profession
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500"
                        }`}
                      >
                        {profession}
                      </button>
                    ))}
                  </div>

                  {formData.profession === "Other" && (
                    <input
                      type="text"
                      placeholder="Enter the profession you need"
                      value={formData.customProfession}
                      onChange={(e) => setFormData({ ...formData, customProfession: e.target.value })}
                      className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 mb-6"
                    />
                  )}
                </>
              ) : (
                // Worker category options
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    {workerCategoryOptions.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, workerCategory: category.id })}
                        className={`p-4 rounded-xl text-center transition-all ${
                          formData.workerCategory === category.id
                            ? "bg-green-500 text-white"
                            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-green-500"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{category.icon}</span>
                        <span className="text-sm font-medium">{category.name}</span>
                      </button>
                    ))}
                  </div>

                  {formData.workerCategory === "other" && (
                    <input
                      type="text"
                      placeholder="Enter the worker type you need"
                      value={formData.customWorkerCategory}
                      onChange={(e) => setFormData({ ...formData, customWorkerCategory: e.target.value })}
                      className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 mb-6"
                    />
                  )}
                </>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-8 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    canProceedStep1
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Job Details */}
          {step === 2 && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Tell us about your {jobCategory === "worker" ? "task" : "project"}
              </h2>
              <p className="text-neutral-500 mb-6">
                Provide details to help {jobCategory === "worker" ? "workers" : "freelancers"} understand your needs
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {jobCategory === "worker" ? "Job Title *" : "Project Title *"}
                  </label>
                  <input
                    type="text"
                    placeholder={jobCategory === "worker" 
                      ? "e.g., Fix kitchen sink leak" 
                      : "e.g., E-commerce Website Development"}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder={jobCategory === "worker"
                      ? "Describe the work needed. Include details about the issue, location, timing preferences..."
                      : "Describe your project in detail. Include goals, features, and any specific requirements..."}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Additional Requirements (Optional)
                  </label>
                  <textarea
                    placeholder="Any additional requirements, preferences, or notes..."
                    value={formData.additionalRequirements}
                    onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                    rows={3}
                    className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    canProceedStep2
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tech Stack (Freelancer) or Location (Worker) */}
          {step === 3 && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              {jobCategory === "freelancer" ? (
                <>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Required Tech Stack
                  </h2>
                  <p className="text-neutral-500 mb-6">
                    Select the technologies needed for this project
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {techStackOptions.map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => handleTechStackToggle(tech)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.techStack.includes(tech)
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500"
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>

                  {formData.techStack.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Selected: {formData.techStack.join(", ")}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Job Location
                  </h2>
                  <p className="text-neutral-500 mb-6">
                    Where should the worker come to perform the job?
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Address / Location *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 123 Main Street, Sector 18, Noida"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <p className="text-sm text-neutral-500 mt-2">
                      This will be shared with the worker once they're hired
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!canProceedStep3}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    canProceedStep3
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Budget & Timeline */}
          {step === 4 && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Budget & Timeline
              </h2>
              <p className="text-neutral-500 mb-6">
                Set your budget range and expected {jobCategory === "worker" ? "job" : "project"} duration
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Budget Range ({jobCategory === "worker" ? "₹" : "USD"}) *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                        {jobCategory === "worker" ? "₹" : "$"}
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Min"
                        value={formData.minBudget}
                        onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                        className="w-full p-4 pl-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                        {jobCategory === "worker" ? "₹" : "$"}
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Max"
                        value={formData.maxBudget}
                        onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                        className="w-full p-4 pl-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Expected Duration *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(jobCategory === "worker" ? workerDurationOptions : durationOptions).map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration })}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${
                          formData.duration === duration
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500"
                        }`}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Job Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Category:</span>
                    <span className={`font-medium px-2 py-0.5 rounded ${
                      jobCategory === "worker" 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    }`}>
                      {jobCategory === "worker" ? "Worker" : "Freelancer"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">
                      {jobCategory === "worker" ? "Worker Type:" : "Profession:"}
                    </span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      {jobCategory === "worker" 
                        ? (formData.workerCategory === "other" ? formData.customWorkerCategory : workerCategoryOptions.find(c => c.id === formData.workerCategory)?.name)
                        : (formData.profession === "Other" ? formData.customProfession : formData.profession)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Title:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">{formData.title}</span>
                  </div>
                  {jobCategory === "freelancer" && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Tech Stack:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">
                        {formData.techStack.length} technologies
                      </span>
                    </div>
                  )}
                  {jobCategory === "worker" && formData.location && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Location:</span>
                      <span className="text-neutral-900 dark:text-white font-medium truncate max-w-[200px]">
                        {formData.location}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Budget:</span>
                    <span className="text-orange-500 font-medium">
                      {jobCategory === "worker" ? "₹" : "$"}{formData.minBudget} - {jobCategory === "worker" ? "₹" : "$"}{formData.maxBudget}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Duration:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">{formData.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    canSubmit && !loading
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Posting..." : "Post Job"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
