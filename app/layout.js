// app/layout.js
import "./globals.css";

export const metadata = {
  title: "Mes tâches",
  description: "Gestionnaire de tâches rangées par projets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}