import type React from "react";

import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide";
};

const sizeStyles = {
  default: "max-w-7xl",
  wide: "max-w-[92rem]",
} as const;

function PageContainer({ children, className, size = "default" }: PageContainerProps) {
  return <div className={cn("mx-auto w-full px-4 py-6 md:px-8 md:py-8", sizeStyles[size], className)}>{children}</div>;
}

export { PageContainer };