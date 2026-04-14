import "./globals.css";
import SupportChat from "@/components/SupportChat";

export const metadata = {
  title: "RistoAgent",
  description: "AI per ristoranti",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        {children}
        <SupportChat />
      </body>
    </html>
  );
}