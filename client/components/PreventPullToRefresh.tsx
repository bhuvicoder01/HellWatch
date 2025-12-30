'use client';

import { useEffect } from 'react';

export default function PreventPullToRefresh() {
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent pull-to-refresh when at the top of the page
      if (window.scrollY === 0 && e.touches[0].clientY > 0) {
        e.preventDefault();
      }
    };

    // Add event listener with passive: false to allow preventDefault
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return null; // This component doesn't render anything
}