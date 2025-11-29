"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const experienceOptions = [
  "Less than 1 year",
  "1-2 years",
  "2-3 years",
  "3-5 years",
  "5-7 years",
  "7-10 years",
  "10+ years"
];

const availabilityOptions = [
  "Full-time (8+ hours/day)",
  "Part-time (4-6 hours/day)",
  "Flexible",
  "Weekends only",
  "Evenings only",
  "On-call / As needed"
];

const serviceAreaOptions = [
  "Within 5 km",
  "Within 10 km",
  "Within 25 km",
  "Within 50 km",
  "Citywide",
  "Willing to travel"
];

export default function WorkerProfileSetup() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [workerCategory, setWorkerCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    experience: "",
    availability: "",
    serviceArea: "",
    hourlyRate: "",
    skills: "",
    bio: "",
    phone: "",
    location: ""
  });

  // Check if user is authenticated and get their worker category
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Get worker category from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setWorkerCategory(userData.workerCategory || "Worker");
        }
      } else {
        router.push("/choice");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("You must be logged in to complete your profile");
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, "users", userId);
      
      // Parse skills into array
      const skillsArray = formData.skills
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await updateDoc(userRef, {
        experience: formData.experience,
        availability: formData.availability,
        serviceArea: formData.serviceArea,
        hourlyRate: parseFloat(formData.hourlyRate),
        skills: skillsArray,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      });

      console.log("Worker profile saved successfully!");
      router.push("/worker/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium mb-4">
            {formatCategoryName(workerCategory)}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            Complete Your <span className="text-green-500">Profile</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Let clients know about your skills and experience
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

          {/* Contact Info */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Contact Information
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-2">Location / Area</label>
                <input
                  type="text"
                  placeholder="e.g., Sector 18, Noida"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
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
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-green-500"
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Availability
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availabilityOptions.map((avail) => (
                <button
                  key={avail}
                  type="button"
                  onClick={() => setFormData({ ...formData, availability: avail })}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    formData.availability === avail
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-green-500"
                  }`}
                >
                  {avail}
                </button>
              ))}
            </div>
          </div>

          {/* Service Area */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Service Area
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {serviceAreaOptions.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setFormData({ ...formData, serviceArea: area })}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    formData.serviceArea === area
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-green-500"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Hourly Rate (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
              <input
                type="number"
                min="1"
                placeholder="500"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full p-3 pl-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">/hour</span>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Your Skills
            </label>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Enter skills separated by commas (e.g., Wiring, Fuse repair, AC installation)
            </p>
            <input
              type="text"
              placeholder="Skill 1, Skill 2, Skill 3..."
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Bio */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <label className="block text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              About You
            </label>
            <textarea
              placeholder="Tell clients about yourself, your experience, and what makes you reliable..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-xl hover:bg-green-600 transition-all hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving Profile..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
