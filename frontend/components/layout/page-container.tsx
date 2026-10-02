import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: "default" | "full" | "narrow";
}

export function PageContainer({
  children,
  className,
  maxWidth = "default",
  ...props
}: PageContainerProps) {
  const maxWidthClass = {
    default: "max-w-7xl",
    full: "max-w-[1700px]",
    narrow: "max-w-4xl",
  }[maxWidth];

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6",
        maxWidthClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
