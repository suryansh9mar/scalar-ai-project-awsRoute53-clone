"use client";

import CButton from "@cloudscape-design/components/button";
import type { ButtonHTMLAttributes } from "react";

type Variant = "normal" | "primary" | "danger" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
  loading?: boolean;
  /** forwarded as href for link-style buttons */
  href?: string;
}

const cloudscapeVariant = (v: Variant): "normal" | "primary" | "link" => {
  // Cloudscape has no "danger" variant — real AWS console uses normal for destructive actions
  if (v === "danger") return "normal";
  if (v === "link") return "link";
  if (v === "primary") return "primary";
  return "normal";
};

export function Button({
  variant = "normal",
  small,
  loading,
  disabled,
  onClick,
  href,
  type = "button",
  children,
}: ButtonProps) {
  return (
    <CButton
      variant={cloudscapeVariant(variant)}
      loading={loading}
      disabled={disabled || loading}
      onClick={onClick as () => void}
      href={href}
      formAction={type === "submit" ? "none" : undefined}
    >
      {children as React.ReactNode}
    </CButton>
  );
}
