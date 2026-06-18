"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlight: string;
};

function SectionPage({ eyebrow, title, description, highlight }: SectionPageProps) {
  return (
    <PageContainer>
      <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              action={
                <div className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">
                  <Sparkles className="size-4" />
                  Coming soon
                </div>
              }
            />
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-white/70">
              <p className="text-sm uppercase tracking-[0.18em] text-white/45">Coming online</p>
              <p className="mt-2 text-sm leading-7">{highlight}</p>
            </div>
          </CardContent>
        </Card>
      </motion.main>
    </PageContainer>
  );
}

export { SectionPage };
