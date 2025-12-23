import Navbar from '@/components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { Inter } from 'next/font/google';
import { VideoProvider } from '@/contexts/VideoContext';


const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  icon: '/favicon.png',
  title: 'HellWatch',
  description: 'Your video streaming app'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VideoProvider>
        <Navbar/>
        {children}
        </VideoProvider>
        </body>
    </html>
  );
}
