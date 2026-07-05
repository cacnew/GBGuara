import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NexusDojo",
  description: "Gestão de escolas de luta",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#faf9f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
