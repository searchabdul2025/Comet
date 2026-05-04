import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ChatFab from "@/components/ChatFab";

const roboto = Roboto({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['300','400','500','700'],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ['400','500','700'],
});

export const metadata: Metadata = {
  title: "Comet Portal",
  description: "Form builder and management portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <ChatFab />
        </Providers>
      </body>
    </html>
  );
}
