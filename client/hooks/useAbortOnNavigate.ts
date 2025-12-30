'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Global AbortController for all API requests
let globalAbortController: AbortController | null = null;

export function getGlobalAbortSignal(): AbortSignal | undefined {
  return globalAbortController?.signal;
}

export function useAbortOnNavigate() {
  const pathname = usePathname();

  // Abort previous controller and create new one on pathname change
  useEffect(() => {
    // Abort previous controller if exists
    if (globalAbortController) {
      globalAbortController.abort();
    }
    // Create new controller
    globalAbortController = new AbortController();
  }, [pathname]);

  // Cleanup on unmount (though usually not needed since pathname change handles it)
  useEffect(() => {
    return () => {
      if (globalAbortController) {
        globalAbortController.abort();
      }
    };
  }, []);

  return globalAbortController?.signal;
}