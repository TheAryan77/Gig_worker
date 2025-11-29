"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const workerCategories = [
  {
    id: "electrician",
    name: "Electrician",
    icon: "⚡",
    description: "Electrical repairs, wiring, installations",
  },
  {
    id: "plumber",
    name: "Plumber",
    icon: "🔧",
    description: "Pipe repairs, installations, drainage",
  },
  {
    id: "carpenter",
    name: "Carpenter",
    icon: "🪚",
    description: "Furniture, woodwork, repairs",
  },
  {
    id: "home-cleaner",
    name: "Home Cleaner",
    icon: "🧹",
    description: "House cleaning, deep cleaning",
  },
  {
    id: "painter",
    name: "Painter",
    icon: "🎨",
    description: "Wall painting, interior/exterior",
  },
  {
    id: "labourer",
    name: "General Labourer",
    icon: "👷",
    description: "Moving, construction help, heavy work",
  },
  {
    id: "gardener",
    name: "Gardener",
    icon: "🌱",
    description: "Lawn care, landscaping, planting",
  },
  {
    id: "ac-technician",
    name: "AC Technician",
    icon: "❄️",
    description: "AC installation, repair, servicing",
  },
  {
    id: "appliance-repair",
    name: "Appliance Repair",
    icon: "🔌",
    description: "TV, fridge, washing machine repair",
  },
  {
    id: "pest-control",
    name: "Pest Control",
    icon: "🐜",
    description: "Pest removal, fumigation",
  },
  {
    id: "driver",
    name: "Driver",
    icon: "🚗",
    description: "Personal driver, deliveries",
  },
  {
    id: "security",
    name: "Security Guard",
    icon: "🛡️",
    description: "Home/office security, night watch",
  },
  {
    id: "cook",
    name: "Cook / Chef",
    icon: "👨‍🍳",
    description: "Meal preparation, catering",
  },
  {
    id: "tailor",
    name: "Tailor",
    icon: "🧵",
    description: "Clothing alterations, stitching",
  },
  {
    id: "other",
    name: "Other",
    icon: "📋",
    description: "Other services not listed",
  },
];

export default function WorkerCategoryPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState("");

  const handleContinue = () => {
    if (!selectedCategory) return;
    
    const category = selectedCategory === "other" ? customCategory : selectedCategory;
    router.push(`/signup?role=worker&category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            Select Your <span className="text-green-500">Work Category</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Choose the type of work you specialize in
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {workerCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedCategory === category.id
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-green-300 dark:hover:border-green-700"
              }`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                {category.name}
              </h3>
              <p className="text-xs text-neutral-500 line-clamp-2">
                {category.description}
              </p>
            </button>
          ))}
        </div>

        {/* Custom Category Input */}
        {selectedCategory === "other" && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Enter your work category
            </label>
            <input
              type="text"
              placeholder="e.g., Welder, Mason, etc."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {/* Selected Category Display */}
        {selectedCategory && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-400">
              <span className="font-semibold">Selected:</span>{" "}
              {selectedCategory === "other" 
                ? customCategory || "Please enter your category"
                : workerCategories.find(c => c.id === selectedCategory)?.name}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/freelancer-type")}
            className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedCategory || (selectedCategory === "other" && !customCategory)}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              selectedCategory && (selectedCategory !== "other" || customCategory)
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
