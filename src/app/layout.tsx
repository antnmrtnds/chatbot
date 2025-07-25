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
        <div
          id="viriato-chatbot-container"
          style={{
            width: "400px",
            height: "600px",
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
          }}
        ></div>
        <script
          id="viriato-chatbot-loader"
          dangerouslySetInnerHTML={{
            __html: `
              var script = document.createElement('script');
              script.src = 'https://f3f6774132db.ngrok-free.app/embed/viriato-chatbot.js';
              script.async = true;
              script.defer = true;
              script.onload = function() {
                if (window.embedViriatoChatbot) {
                  window.embedViriatoChatbot({
                    containerId: 'viriato-chatbot-container',
                  });
                }
              };
              document.body.appendChild(script);
            `,
          }}
        />
      </body>
    </html>
  );
}
