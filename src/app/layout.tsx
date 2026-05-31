import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ background: "transparent" }}>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("hdstream_theme");if(t)document.documentElement.setAttribute("data-theme",t);var m=localStorage.getItem("hdstream_dark_mode");if(m!==null)document.documentElement.setAttribute("data-mode",m==="true"?"dark":"light")}catch(e){}})()`
        }} />
        <div className="fixed-bg" />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}