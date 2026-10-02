import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/content-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Contact",
  description: "Get in touch with GitTiger.",
  path: "/contact",
  eyebrow: "CONTACT",
});

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch"
      lede="Corrections, removal requests, press, partnerships. We read everything."
    >
      <p className="text-[15px] text-muted-foreground">
        Prefer email? Write to{" "}
        {/* Email rendered as an SVG image so it cannot be scraped from the
            HTML source. alt text is the only plain-text copy, and it is
            intentionally spaced to defeat naive harvesters. */}
        <Image
          src="/email.svg"
          alt="ankit at athelp dot in"
          width={152}
          height={22}
          className="inline-block h-[22px] w-auto align-text-bottom"
          priority
        />
        .
      </p>
      <EnquiryForm
        submitLabel="Send message"
        messagePlaceholder="How can we help?"
        successTitle="Message received"
        successBody="Thanks for writing. We'll get back to you by email."
      />
    </PageShell>
  );
}
