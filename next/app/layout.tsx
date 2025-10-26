export const metadata = {
  title: 'Next API Host',
  description: 'Hosts BLE fall POST API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


