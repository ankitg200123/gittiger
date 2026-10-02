import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export function PageShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 lg:py-24">
        <span className="label-mono">{eyebrow}</span>
        <h1 className="mt-4 text-[34px] sm:text-[44px] font-semibold tracking-tight leading-[1.08] text-balance">
          {title}
        </h1>
        {lede && (
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">{lede}</p>
        )}
        <hr className="hairline my-10" />
        <div className="space-y-12">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[22px] font-semibold tracking-tight mb-4">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_code]:tabular [&_code]:text-foreground">
        {children}
      </div>
    </section>
  );
}

export function CodeCut({ children }: { children: string }) {
  return (
    <pre className="codecut overflow-x-auto px-5 py-4 text-[13.5px] leading-relaxed text-mosaic-cyan">
      <code>{children}</code>
    </pre>
  );
}
