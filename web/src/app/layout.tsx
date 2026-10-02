import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SearchPalette } from "@/components/search-palette";
import { WebsiteJsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, socialImageUrl } from "@/lib/seo";

/* Inter for UI/body, JetBrains Mono for every numeric. See design-system MASTER.md */
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GitTiger — discover what developers are building right now",
    template: "%s · GitTiger",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    siteName: SITE_NAME,
    images: [
      {
        url: socialImageUrl({
          title: "Discover what developers are building right now",
          description: SITE_DESCRIPTION,
          path: "/",
          eyebrow: "AI & DEVELOPER PROJECTS · DAILY",
        }),
        width: 1200,
        height: 630,
        alt: "GitTiger — discover what developers are building right now",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      socialImageUrl({
        title: "Discover what developers are building right now",
        description: SITE_DESCRIPTION,
        path: "/",
        eyebrow: "AI & DEVELOPER PROJECTS · DAILY",
      }),
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <WebsiteJsonLd />
        {children}
        <SearchPalette />
      </body>
    </html>
  );
}
