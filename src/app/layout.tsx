'use client';
import type { Metadata } from 'next';
import { Mohave } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import '@/styles/quill.css';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

const mohave = Mohave({ 
  subsets: ['latin'],
  variable: '--font-mohave',
  display: 'swap'
});



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    
    const handleMediaQueryChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Check initial
    handleMediaQueryChange(mediaQuery);

    // Add listener for changes
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleMediaQueryChange);
  }, []);

  return (
    <html lang="en" className={mohave.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Admin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Admin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
          <Provider store={store}>
            {children}
            <ToastContainer position="bottom-right" />
          </Provider>
      </body>
    </html>
  );
}
