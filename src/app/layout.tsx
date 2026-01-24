import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokédex - Sistema Pokémon",
  description: "Explore o mundo Pokémon com a Pokédex completa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
