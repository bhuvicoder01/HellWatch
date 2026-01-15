import { useEffect, useRef, useState } from 'react';

export const useUploadProgress = (uploadKey: string | null) => {
  const [uploadRate, setUploadRate] = useState<string | number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!uploadKey) return;

    const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', key: uploadKey }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
          setUploadRate(data.uploadRate);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      setUploadRate(0);
    };
  }, [uploadKey]);

  return { uploadRate, ws: wsRef.current };
};
