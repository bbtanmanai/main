import "@/styles/pages/webnovel.css";
import WebnovelThemeForcer from "./_components/WebnovelThemeForcer";

export default function WebnovelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebnovelThemeForcer />
      {children}
    </>
  );
}
