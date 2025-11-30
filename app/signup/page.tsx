import { Suspense } from "react"
import { SignupForm } from "@/components/signup-form"

function SignupFormFallback() {
  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
        <div className="space-y-3 mt-6">
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
        <div className="h-10 bg-orange-200 dark:bg-orange-900/30 rounded mt-4"></div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<SignupFormFallback />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
