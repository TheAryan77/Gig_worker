"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const techStackOptions = [
  "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js",
  "Python", "Django", "Flask", "Java", "Spring Boot", "Go",
  "Rust", "TypeScript", "JavaScript", "PHP", "Laravel", "Ruby",
  "Ruby on Rails", "Swift", "Kotlin", "Flutter", "React Native",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "MongoDB",
  "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST API", "Solidity",
  "Web3", "Blockchain", "AI/ML", "TensorFlow", "PyTorch"
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

const experienceOptions = [
  "Less than 1 year",
  "1-2 years",
  "2-3 years",
  "3-5 years",
  "5-7 years",
  "7-10 years",
  "10+ years"
];

const responseTimeOptions = [
  "Within 1 hour",
  "Within 2-4 hours",
  "Within 24 hours",
  "Within 2-3 days",
  "Within a week"
];

export default function FreelancerProfileSetup() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    profession: "",
    customProfession: "",
    techStack: [] as string[],
    experience: "",
    responseTime: "",
    hourlyRate: "",
    bio: ""
  });

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Redirect to signup if not authenticated
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
      setError("You must be logged in to complete your profile");
      return;
    }

    if (formData.techStack.length === 0) {
      setError("Please select at least one technology");
      return;
    }

    setLoading(true);

    try {
      // Update the user document in Firestore with profile data
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        // Profile fields
        profession: formData.profession === "Other" ? formData.customProfession : formData.profession,
        techStack: formData.techStack,
        experience: formData.experience,
        responseTime: formData.responseTime,
        hourlyRate: parseFloat(formData.hourlyRate),
        bio: formData.bio,
        // Profile completion status
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      });

      console.log("Profile saved successfully!");
      router.push("/freelancer/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            Complete Your <span className="text-orange-500">Profile</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Let clients know about your skills and expertise
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Profession */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              What's your profession?
            </label>
            <select
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              className="w-full p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select your profession</option>
              {professionOptions.map((profession) => (
                <option key={profession} value={profession}>
                  {profession}
                </option>
              ))}
            </select>
            {formData.profession === "Other" && (
              <input
                type="text"
                placeholder="Enter your profession"
                value={formData.customProfession}
                onChange={(e) => setFormData({ ...formData, customProfession: e.target.value })}
                className="w-full mt-4 p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            )}
          </div>

          {/* Tech Stack */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Your Tech Stack
            </label>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Select all technologies you're proficient in
            </p>
            <div className="flex flex-wrap gap-2">
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
              <p className="mt-4 text-sm text-orange-500">
                Selected: {formData.techStack.length} technologies
              </p>
            )}
          </div>

          {/* Experience */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Years of Experience
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {experienceOptions.map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setFormData({ ...formData, experience: exp })}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    formData.experience === exp
                      ? "bg-orange-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500"
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Average Response Time */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Average Response Time
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {responseTimeOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setFormData({ ...formData, responseTime: time })}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    formData.responseTime === time
                      ? "bg-orange-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Hourly Rate (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="number"
                min="1"
                placeholder="50"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full p-3 pl-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">/hour</span>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Short Bio
            </label>
            <textarea
              placeholder="Tell clients about yourself, your experience, and what makes you unique..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-xl hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving Profile..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
