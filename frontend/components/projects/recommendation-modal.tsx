"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { AIWorkloadRecommendation } from "@/types/ai";
import { RecommendationCard } from "./recommendation-card";

type RecommendationModalProps = {
  open: boolean;
  recommendations: AIWorkloadRecommendation[];
  onClose: () => void;
};

function RecommendationModal({ open, recommendations, onClose }: RecommendationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableSelectors = [
        "button:not([disabled])",
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelectors);

      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (typeof document === "undefined") {
    return null;
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={onClose}
          role="presentation"
        >
          <div
            className="w-[90vw] max-w-[800px]"
            onClick={(event) => event.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
              role="dialog"
              aria-modal="true"
              aria-label="AI Reassignment Recommendations"
            >
              <div
                ref={modalRef}
                className="hidden-scrollbar flex max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A] shadow-[0_40px_120px_-32px_rgba(0,0,0,0.92)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-white">AI Reassignment Recommendations</h2>
                    <p className="text-sm text-white/55">Generated using workload, skills and availability analysis.</p>
                  </div>
                  <Button
                    ref={closeButtonRef}
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={onClose}
                    className="shrink-0 rounded-full border-white/10 bg-white/5 text-white/70 transition hover:border-white/20 hover:bg-white/10"
                    aria-label="Close recommendations modal"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="hidden-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-3">
                    {recommendations.map((recommendation, index) => (
                      <motion.div
                        key={recommendation.taskId}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.22, delay: index * 0.06 }}
                      >
                        <RecommendationCard recommendation={recommendation} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { RecommendationModal };
