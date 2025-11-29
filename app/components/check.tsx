import React from 'react'
import CompareDemo from './CodePreview'

const Check = () => {
  return (
    <div className="w-full py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column - Description */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white">
            Compare <span className='text-orange-500'>Before</span> & <span className='text-orange-500'>After</span>
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            See the difference between your code problems and solutions with our 
            interactive comparison tool. Hover over the image to reveal the 
            transformation and understand how clean, optimized code can improve 
            your projects.
          </p>
          <ul className="space-y-3 text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Interactive hover comparison
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Side-by-side code analysis
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Instant visual feedback
            </li>
          </ul>
        </div>

        {/* Right Column - Compare Demo */}
        <div className="flex justify-center md:justify-end">
          <CompareDemo />
        </div>
      </div>
    </div>
  )
}

export default Check