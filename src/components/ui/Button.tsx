"use client";

import * as React from "react";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, string> = {
  sm: "h-[36px] px-3 text-[12px]",
  md: "h-[42px] px-4 text-[13px] font-semibold",
  lg: "h-[48px] px-5 text-[14px] font-bold",
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-zed-950 text-white hover:bg-zed-900 disabled:bg-zed-950 disabled:opacity-60",
  secondary:
    "bg-white hover:bg-zed-950/5 border border-edge text-[#07111F] hover:bg-zed-900/5 disabled:bg-white disabled:opacity-60 disabled:border-edge",
  outline:
    "border border-edge bg-white text-[#07111F] hover:bg-zed-950 hover:text-white disabled:bg-white disabled:opacity-60 disabled:border-edge",
  danger:
    "border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:bg-white disabled:opacity-60 disabled:border-red-200",
  ghost:
    "bg-transparent text-charcoal/70 hover:bg-zed-950/5 disabled:bg-transparent disabled:opacity-60",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, size = "md", variant = "primary", loading, fullWidth, disabled, children, ...props }, ref) {
    return (
      <button
        type="button"
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center rounded-zed transition-colors",
          "disabled:cursor-not-allowed",
          sizeStyles[size],
          variantStyles[variant],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 size-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
