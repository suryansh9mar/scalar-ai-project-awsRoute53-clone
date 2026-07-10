"use client";

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from "react";
import React from "react";
import CFormField from "@cloudscape-design/components/form-field";
import CInput from "@cloudscape-design/components/input";
import CTextarea from "@cloudscape-design/components/textarea";
import CSelect, { type SelectProps } from "@cloudscape-design/components/select";

/* ---------- Field ---------- */
export function Field({
  label,
  optional,
  description,
  error,
  children,
}: {
  label?: ReactNode;
  optional?: boolean;
  description?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <CFormField
      label={
        label ? (
          <>
            {label}
            {optional && (
              <span style={{ fontWeight: 400, color: "var(--color-text-form-secondary)", fontStyle: "italic" }}>
                {" "}— optional
              </span>
            )}
          </>
        ) : undefined
      }
      description={description as string}
      errorText={error}
    >
      {children}
    </CFormField>
  );
}

/* ---------- TextInput ---------- */
export function TextInput({
  invalid,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  required,
  autoFocus,
  autoComplete,
  min,
  max,
  maxLength,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <CInput
      value={String(value ?? "")}
      invalid={invalid}
      onChange={({ detail }) =>
        onChange?.({ target: { value: detail.value } } as React.ChangeEvent<HTMLInputElement>)
      }
      placeholder={placeholder}
      type={type as "text" | "number" | "email" | "password" | "search" | "url"}
      disabled={disabled}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
    />
  );
}

/* ---------- Textarea ---------- */
export function Textarea({
  invalid,
  value,
  onChange,
  placeholder,
  rows,
  maxLength,
  disabled,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <CTextarea
      value={String(value ?? "")}
      invalid={invalid}
      onChange={({ detail }) =>
        onChange?.({ target: { value: detail.value } } as React.ChangeEvent<HTMLTextAreaElement>)
      }
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
    />
  );
}

/* ---------- Select ---------- */
/**
 * Wraps Cloudscape Select while keeping the native <select> API (children as <option> elements).
 * Parses option children automatically so callers need no changes.
 */
export function Select({
  value,
  onChange,
  children,
  className,
  "aria-label": ariaLabel,
  disabled,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  // Parse <option> children into Cloudscape option objects
  const options: SelectProps.Option[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === "option") {
      const props = child.props as { value: string; children: string; disabled?: boolean };
      options.push({
        value: props.value,
        label: String(props.children),
        disabled: props.disabled,
      });
    }
  });

  const selectedOption =
    options.find((o) => o.value === String(value ?? "")) ?? null;

  return (
    <CSelect
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        const fakeEvent = {
          target: { value: detail.selectedOption?.value ?? "" },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange?.(fakeEvent);
      }}
      options={options}
      ariaLabel={ariaLabel}
      disabled={disabled}
    />
  );
}
