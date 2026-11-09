import type { Metadata } from "next";
import { Suspense } from "react";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Providers } from "@/components/providers";
import { appName, basePath } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Microsserv52 | " + appName,
    template: "%s | Microsserv52",
  },
  description:
    "An educational demo store. Browse products and create demo orders. No real payments, transactions, or shipments.",
  manifest:
    appName === "store" ? basePath + "/manifest.webmanifest" : undefined,
  icons: { icon: basePath + "/brand.png" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <Providers>
          <Suspense fallback={<p role="status">Loading demo…</p>}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
