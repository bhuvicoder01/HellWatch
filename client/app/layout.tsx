import Navbar from '@/components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { Inter } from 'next/font/google';
import { VideoProvider } from '@/contexts/VideoContext';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';


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
        <AuthProvider>
        <VideoProvider>
        <Navbar/>
        <div className='container 'style={{padding:'150px 10px 50px 10px'}}>
        {children}
        </div>
        <Footer/>
        </VideoProvider>
        </AuthProvider>
        </body>
    </html>
  );
}
