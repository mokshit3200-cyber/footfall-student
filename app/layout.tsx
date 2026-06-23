import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { AuthProvider } from "@/lib/auth";
import PWA from "@/components/PWA";

export const metadata: Metadata = {
  title: "Footfall Student",
  description: "Attendance, deadlines, grades, money — your campus, sorted.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Footfall",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StoreProvider>
            <div className="min-h-screen bg-black">{children}</div>
            <PWA />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
