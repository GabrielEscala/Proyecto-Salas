import "./globals.css";
import "sonner/dist/styles.css";
import { Inter } from "next/font/google";
import Providers from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter"
});

export const metadata = {
  title: "Reserva de Salas | Sistema Corporativo",
  description:
    "Sistema interno para reservar salas y cabinas de reuniones. Disponible 24/7 con bloques de 30 minutos.",
  keywords: "reserva salas, reuniones, cabinas, sistema corporativo"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E7CFF"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

