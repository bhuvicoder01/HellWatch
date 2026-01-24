import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface TranscodingStatus {
  jobId: string;
  status: 'SUBMITTED' | 'PROGRESSING' | 'COMPLETE' | 'ERROR' | 'CANCELED';
  progress: number;
}

export const useTranscodingStatus = (jobId: string | null) => {
  const [status, setStatus] = useState<TranscodingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/videos/transcode/${jobId}`);
        setStatus(response.data);
        
        // Stop polling if job is complete or failed
        if (['COMPLETE', 'ERROR', 'CANCELED'].includes(response.data.status)) {
          return;
        }
      } catch (err) {
        setError('Failed to check transcoding status');
        console.error('Transcoding status error:', err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 30 seconds for status updates
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [jobId]);

  return { status, error };
};