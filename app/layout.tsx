import "./globals.css";

export const metadata = {
  title: "RistoAgent",
  description: "AI per ristoranti",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}