import React from 'react'
import CompareDemo from './CodePreview'
import CodeBlockDemo from './Codeblock'

const Check2 = () => {
    return (

        <div className="w-full py-16 px-6 md:px-12 lg:px-24">

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Left Column - Description */}
                <div className="flex justify-center md:justify-end">
                    <CodeBlockDemo />
                </div>
                <div className="space-y-6">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white">
Where Trust <span className='text-orange-500'>Meets</span> Tech 🚀</h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        No more chasing clients.
                        No more “bhai kal payment de dunga.”
                        No more ghosting after delivery.

                        With our smart-contract escrow + AI verification:
                    </p>
                    <ul className="space-y-3 text-neutral-600 dark:text-neutral-400">
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
Payments stay locked until work is done                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
AI checks the work before clients even blink
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
Funds release automatically—no arguments, no drama
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
Everybody stays happy, even the code 😉
                        </li>
                    </ul>
                </div>

                {/* Right Column - Compare Demo */}

            </div>
        </div>
    )
}

export default Check2