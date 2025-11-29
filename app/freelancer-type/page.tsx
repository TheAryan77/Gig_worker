"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FollowerPointerCard } from "@/components/ui/following-pointer";

const FreelancerTypePage = () => {
  const router = useRouter();

  const handleChoice = (type: string) => {
    if (type === "coder") {
      router.push("/signup?role=freelancer&type=coder");
    } else {
      router.push("/worker-category");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
          What type of <span className="text-orange-500">Freelancer</span> are you?
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Choose your work category to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Coder Card */}
        <FollowerPointerCard
          title="Join as Coder"
          className="group"
        >
          <div
            onClick={() => handleChoice("coder")}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-8 transition-all duration-300 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                I'm a Coder
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Software Developer, Web Developer, Mobile App Developer, Data Scientist, AI/ML Engineer, and more tech roles.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">React</span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">Python</span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">Node.js</span>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-purple-500 font-medium group-hover:gap-3 transition-all">
                  Get Started
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </FollowerPointerCard>

        {/* Worker Card */}
        <FollowerPointerCard
          title="Join as Worker"
          className="group"
        >
          <div
            onClick={() => handleChoice("worker")}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-8 transition-all duration-300 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                I'm a Worker
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Electrician, Plumber, Carpenter, Home Cleaner, Painter, Labourer, and other service-based work.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">Electrician</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">Plumber</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">Cleaner</span>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-green-500 font-medium group-hover:gap-3 transition-all">
                  Get Started
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </FollowerPointerCard>
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push("/choice")}
        className="mt-8 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-2 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to role selection
      </button>
    </div>
  );
};

export default FreelancerTypePage;
