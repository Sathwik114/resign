import "./globals.css";

export const metadata = {
  title: "Resign Forms Management System",
  description: "Developed by IT team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
