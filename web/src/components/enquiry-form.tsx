"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { GlassCard } from "@/components/glass-card";

type Props = {
  submitLabel: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  successTitle: string;
  successBody: string;
  extraField?: { name: string; label: string; placeholder: string; type?: string; required?: boolean };
};

const input =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 transition-colors duration-200 hover:border-white/20 focus-visible:border-white/30 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

export function EnquiryForm({
  submitLabel,
  messageLabel = "Message",
  messagePlaceholder,
  successTitle,
  successBody,
  extraField,
}: Props) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <GlassCard className="p-6" role="status">
        <span className="label-mono !text-mosaic-green">Received</span>
        <h3 className="mt-3 text-[18px] font-semibold">{successTitle}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{successBody}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="label-mono">Name</span>
            <input name="name" required autoComplete="name" className={input} placeholder="Ada Lovelace" />
          </label>
          <label className="block space-y-2">
            <span className="label-mono">Email</span>
            <input name="email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" />
          </label>
        </div>
        {extraField && (
          <label className="block space-y-2">
            <span className="label-mono">{extraField.label}</span>
            <input
              name={extraField.name}
              type={extraField.type ?? "text"}
              required={extraField.required}
              className={input}
              placeholder={extraField.placeholder}
            />
          </label>
        )}
        <label className="block space-y-2">
          <span className="label-mono">{messageLabel}</span>
          <textarea name="message" required rows={5} className={cn(input, "resize-y")} placeholder={messagePlaceholder} />
        </label>
        <button
          type="submit"
          className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </form>
    </GlassCard>
  );
}
