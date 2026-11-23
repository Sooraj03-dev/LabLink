import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";

const displayFont = localFont({
  src: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  variable: "--lab-display",
  display: "optional",
  weight: "100 900",
  adjustFontFallback: "Times New Roman",
});
const bodyFont = localFont({
  src: "../../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2",
  variable: "--lab-body",
  preload: false,
  display: "optional",
  weight: "100 900",
});
const monoFont = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--lab-mono",
  display: "optional",
  weight: "100 800",
  preload: false,
});
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { currentUser } from "@/server/session";
import { sampleRole } from "@/server/sample-session";
import "@/styles/globals.css";
import "@/styles/workbench.css";

export const metadata: Metadata = {
  title: {
    default: "LabLink | Campus laboratory resource sharing",
    template: "%s | LabLink",
  },
  description:
    "Find specialised equipment, development kits and workstations across campus laboratories.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  const demoRole = user ? undefined : await sampleRole();
  const account = user
    ? { name: user.displayName, role: user.role, demo: user.demo }
    : demoRole
      ? { name: "Demo " + demoRole, role: demoRole, demo: true }
      : null;
  return (
    <html
      lang="en"
      className={[
        displayFont.variable,
        bodyFont.variable,
        monoFont.variable,
      ].join(" ")}
    >
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader account={account} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
