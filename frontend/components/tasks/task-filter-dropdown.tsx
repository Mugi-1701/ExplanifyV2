"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TaskFilterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
};

function TaskFilterDropdown({
  value,
  onChange,
  options,
  placeholder = "Select option",
  icon,
  className,
}: TaskFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (containerRef.current) {
      const contentHeight = containerRef.current.scrollHeight;
      setContainerHeight(isOpen ? contentHeight : 56); // 56px = h-14
    }
  }, [isOpen, options]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition-all duration-300",
        isOpen ? "shadow-[0_0_32px_rgba(59,130,246,0.2)] border-violet-400/30" : "",
        className
      )}
      style={{ minHeight: isOpen ? `${containerHeight}px` : "56px" }}
    >
      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-10 flex h-14 w-full items-center justify-between gap-3 px-4 py-3 text-sm text-white transition hover:bg-white/5 focus:outline-none"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-left">{selectedLabel}</span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 flex-shrink-0 text-white/50 transition duration-300",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Dropdown options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 left-0 right-0 z-20 border-t border-white/10 bg-gradient-to-b from-white/[0.08] to-black/40 backdrop-blur-xl"
          >
            <div className="divide-y divide-white/5">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm transition",
                    value === option.value
                      ? "bg-violet-500/20 text-violet-100"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {value === option.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    )}
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { TaskFilterDropdown };
