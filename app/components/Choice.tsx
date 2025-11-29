"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FollowerPointerCard } from "@/components/ui/following-pointer";

const Choice = () => {
  const router = useRouter();

  const handleChoice = (role: string) => {
    if (role === "freelancer") {
      // Redirect to choose between coder/worker
      router.push("/freelancer-type");
    } else {
      router.push(`/signup?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
          How would you like to <span className="text-orange-500">join</span>?
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Select your role to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Client Card */}
        <FollowerPointerCard
          title="Join as Client"
          className="group"
        >
          <div
            onClick={() => handleChoice("client")}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-8 transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                I'm a Client
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Looking to hire talented freelancers for your projects. Post jobs and find the perfect match.
              </p>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-blue-500 font-medium group-hover:gap-3 transition-all">
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

        {/* Freelancer/Worker Card */}
        <FollowerPointerCard
          title="Join as Freelancer"
          className="group"
        >
          <div
            onClick={() => handleChoice("freelancer")}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-8 transition-all duration-300 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-orange-500"
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
                I'm a Freelancer
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Ready to showcase your skills and find amazing projects. Join our community of talented workers.
              </p>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-orange-500 font-medium group-hover:gap-3 transition-all">
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
    </div>
  );
};

export default Choice;
