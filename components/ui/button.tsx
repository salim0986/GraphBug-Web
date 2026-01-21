"use client";

import * as React from "react";
import Link from "next/link";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonBaseProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  href?: string;
  className?: string;
}

// Combine props to allow standard HTML attributes for both button and anchor
type ButtonProps = ButtonBaseProps & Omit<HTMLMotionProps<"button"> & HTMLMotionProps<"a">, "children" | "ref">;

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, href, ...props }, ref) => {
    const variants = {
      primary: "bg-[var(--primary)] text-[var(--text)] shadow-lg shadow-[var(--primary)]/20 border-transparent hover:brightness-110",
      secondary: "bg-white text-[var(--text)] border-2 border-[var(--text)]/20 hover:border-[var(--primary)]/30 hover:bg-[var(--background)]",
      outline: "bg-transparent text-[var(--text)] border-2 border-[var(--text)]/20 hover:border-[var(--primary)]/30 hover:bg-[var(--background)]",
      ghost: "bg-transparent text-[var(--text)]/70 hover:bg-[var(--text)]/10 dark:hover:bg-[var(--text)]/20",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const combinedClassName = cn(
      "relative rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 cursor-pointer",
      variants[variant],
      sizes[size],
      className
    );

    const content = (
      <>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
            {children}
        </span>
      </>
    );

    const motionProps = {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      ...props
    };

    if (href) {
      return (
        <Link href={href} legacyBehavior passHref>
          <motion.a
            ref={ref as React.Ref<HTMLAnchorElement>}
            className={combinedClassName}
            {...(motionProps as HTMLMotionProps<"a">)}
          >
            {content}
          </motion.a>
        </Link>
      );
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={combinedClassName}
        disabled={isLoading || (props as any).disabled}
        {...(motionProps as HTMLMotionProps<"button">)}
      >
        {content}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
