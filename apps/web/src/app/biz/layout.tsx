import React from 'react';
import FrontGNB from '@/components/FrontGNB';
import FrontFooter from '@/components/FrontFooter';

export default function BizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <FrontGNB />
      <main className="flex-grow pt-[52px]">
        {children}
      </main>
      <FrontFooter />
    </div>
  );
}
