import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import FetchInterceptor from "./components/FetchInterceptor";


const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "SIPPOL PP Buleleng",
  description: "Sistem Informasi Pelayanan Publik & Operasional Satpol PP Buleleng",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script src="/api-env.js" />
      </head>
      <body className="min-h-full flex flex-col">
        <FetchInterceptor />
        {children}
      </body>
    </html>
  );
}
