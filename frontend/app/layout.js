import "./globals.css";
import AuroraBackground from "../components/AuroraBackground";

export const metadata = {
  title: "AI Voice Support Agent",
  description: "Talk to our AI support agent — instant answers, real-time data.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
