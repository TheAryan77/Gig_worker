import { div } from "motion/react-client"
import BackgroundLinesDemo from "./SpotlightPreview"
import React from 'react'

const Hero = () => {
    return (
        <>
            <div className="bg-[radial-gradient(circle_at_center,_rgba(255,165,0,0.1),_transparent_70%)]
">
                <BackgroundLinesDemo />

            </div>
        </>

    )
}

export default Hero