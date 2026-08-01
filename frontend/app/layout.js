import "./globals.css";

export const metadata = {
  title: "AI Voice Support Agent",
  description: "Talk to our AI support agent — instant answers, real-time data.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
