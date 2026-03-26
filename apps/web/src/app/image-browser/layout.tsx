export const metadata = { title: 'LinkDrop — 씬 관리' };

export default function ImageBrowserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
