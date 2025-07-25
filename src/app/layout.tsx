import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evergreen Pure - Apartamentos em Aveiro",
  description: "Evergreen Pure - 16 apartamentos modernos em Santa Joana, Aveiro. Tipologias T1, T2, T3 com arquitetura contemporânea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-2QFEQS8FQF"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2QFEQS8FQF');
            `,
          }}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
        <Script
          src="https://chatbot-azure-eight-78.vercel.app/loader.js"
          data-api-key="2d912f2b-18a6-4eea-9f21-ef72bc20a1ec"
          async
          defer
        />
      </body>
    </html>
  );
}
