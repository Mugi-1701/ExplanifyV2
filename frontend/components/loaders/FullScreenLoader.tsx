/**
 * Full-screen loader component
 * Used during auth initialization and route transitions
 */

"use client";

import { motion } from "framer-motion";

type FullScreenLoaderProps = {
  message?: string;
};

export function FullScreenLoader({ message = "Loading..." }: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(to_bottom,#050816,#050816)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <div className="relative size-12">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-blue-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-1 rounded-full border-2 border-transparent border-b-violet-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-white/60"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default FullScreenLoader;
