import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";
import AppTracker from "@/components/AppTracker";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viriato - Imobiliária em Aveiro",
  description: "Encontre o seu imóvel ideal em Aveiro com a Viriato. Apartamentos, moradias e escritórios para venda e arrendamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Suspense fallback={null}>
          <AppTracker />
        </Suspense>
        <Script
          id="userled-sdk-snippet"
          dangerouslySetInnerHTML={{
            __html: `window.userledSettings={app_id:"881e48e0-291e-48c6-95f4-9e1fb069a7fd",region:"eu-west-2"},window.userledSnippetTs=(new Date).getTime(),(function(){if(!window.Userled){window.Userled=function(){return e.call(arguments)};var e=window.Userled;e.call=function(n){return new Promise((function(i,w){e.queue.push([].concat.apply([i,w],n))}))},e.queue=[],e.snippetVersion="4.0.0",window.Userled("page")}})();`,
          }}
        />
        <Script
          id="userled-sdk"
          type="module"
          src="https://sdk.userledclient.io?appId=881e48e0-291e-48c6-95f4-9e1fb069a7fd&snippetVersion=4.0.0"
          data-cfasync="false"
        />
      </body>
    </html>
  );
}
