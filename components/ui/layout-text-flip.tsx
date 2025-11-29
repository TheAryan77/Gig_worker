"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutTextFlipProps {
  words: string[];
  duration?: number;
  className?: string;
  wrapperClassName?: string;
}

export function LayoutTextFlip({
  words,
  duration = 2000,
  className = "text-orange-500 font-extrabold",
  wrapperClassName = "",
}: LayoutTextFlipProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % words.length),
      duration
    );
    return () => clearInterval(id);
  }, [words, duration]);

  const variants = {
    enter: { opacity: 0, y: 8 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <span className={`inline-flex items-center ${wrapperClassName}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4 }}
          style={{ fontSize: "inherit", lineHeight: "inherit" }}
          className={`${className} inline-block`}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
