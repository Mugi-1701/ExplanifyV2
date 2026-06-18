"use client";

import type React from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg" | "xl";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogSize;
  className?: string;
};

const sizeStyles: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function Dialog({ open, onOpenChange, title, description, children, footer, size = "lg", className }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn("w-full", sizeStyles[size], className)}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <Card className="border-white/10 bg-[#09111f]/95 shadow-[0_35px_110px_-30px_rgba(0,0,0,0.88)] backdrop-blur-2xl">
              <CardHeader className="flex-row items-start justify-between gap-4 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl text-white">{title}</CardTitle>
                  {description ? <CardDescription className="max-w-2xl text-white/60">{description}</CardDescription> : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onOpenChange(false)}
                  className="shrink-0 border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  aria-label="Close dialog"
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">{children}</CardContent>
              {footer ? <div className="border-t border-white/10 px-6 py-5">{footer}</div> : null}
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export { Dialog };