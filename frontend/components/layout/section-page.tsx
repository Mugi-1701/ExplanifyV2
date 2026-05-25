"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlight: string;
};

function SectionPage({ eyebrow, title, description, highlight }: SectionPageProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="px-4 py-6 md:px-8 md:py-8"
    >
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-100">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">{eyebrow}</p>
            <CardTitle className="text-3xl text-white md:text-5xl">{title}</CardTitle>
            <CardDescription className="max-w-3xl text-white/60 md:text-base">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-white/70">
            <p className="text-sm uppercase tracking-[0.18em] text-white/45">Coming online</p>
            <p className="mt-2 text-sm leading-7">{highlight}</p>
          </div>
        </CardContent>
      </Card>
    </motion.main>
  );
}

export { SectionPage };