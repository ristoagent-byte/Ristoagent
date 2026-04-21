import "./globals.css";
import SupportChat from "@/components/SupportChat";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: {
    default: "RistoAgent — Agente AI per prenotazioni ristorante su Telegram",
    template: "%s | RistoAgent",
  },
  description:
    "RistoAgent gestisce prenotazioni, cancellazioni e messaggi Telegram per il tuo ristorante, 24h su 24. Setup in 10 minuti, prova gratis 15 giorni.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "RistoAgent — Agente AI per prenotazioni ristorante su Telegram",
    description:
      "Gestisce prenotazioni, cancellazioni e messaggi Telegram per il tuo ristorante, 24h su 24. Prova gratis 15 giorni.",
    url: "https://www.ristoagent.com",
    siteName: "RistoAgent",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://www.ristoagent.com/icon.png",
        width: 512,
        height: 512,
        alt: "RistoAgent logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "RistoAgent — Agente AI per prenotazioni ristorante su Telegram",
    description: "Gestisce prenotazioni e messaggi Telegram per il tuo ristorante, 24h su 24.",
    images: ["https://www.ristoagent.com/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RistoAgent",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Telegram",
  url: "https://www.ristoagent.com",
  description:
    "Agente AI che gestisce prenotazioni, cancellazioni e messaggi Telegram per ristoranti, 24h su 24.",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "EUR",
  },
};

// JSON-LD is static hardcoded data — no user input, no XSS risk
const jsonLdString = JSON.stringify(jsonLd);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      </head>
      <body>
        {children}
        <SupportChat />
        <Analytics />
      </body>
    </html>
  );
}