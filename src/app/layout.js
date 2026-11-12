import "./globals.css";
import IdleLogout from "./IdleLogout";

export const metadata = {
  title: "Resign & ESI Applications Management System",
  description: "Developed by IT team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <IdleLogout />
        {children}
      </body>
    </html>
  );
}
