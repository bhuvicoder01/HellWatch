'use client'
import { useState, useEffect } from 'react';
import { videoAPI } from '@/services/api';

interface TranscodingStatusProps {
  videoId: string;
  onComplete?: () => void;
}

export default function TranscodingStatus({ videoId, onComplete }: TranscodingStatusProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!videoId) return;

    const checkStatus = async () => {
      try {
        const response = await videoAPI.getTranscodingStatus(videoId);
        setStatus(response.data.status);
        setProgress(response.data.progress || 0);
        
        if (response.data.status === 'COMPLETE') {
          onComplete?.();
        } else if (response.data.status === 'ERROR') {
          setError('Transcoding failed');
        }
      } catch (err) {
        setError('Failed to get transcoding status');
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 10 seconds if not complete
    const interval = setInterval(() => {
      if (status !== 'COMPLETE' && status !== 'ERROR') {
        checkStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [videoId, status, onComplete]);

  const getStatusColor = () => {
    switch (status) {
      case 'COMPLETE': return 'text-green-600';
      case 'ERROR': return 'text-red-600';
      case 'PROGRESSING': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'PENDING': return 'Waiting to start...';
      case 'SUBMITTED': return 'Job submitted...';
      case 'PROGRESSING': return `Processing... ${progress}%`;
      case 'COMPLETE': return 'Transcoding complete!';
      case 'ERROR': return 'Transcoding failed';
      default: return 'Unknown status';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Video Processing</h3>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {status === 'PROGRESSING' && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {status === 'COMPLETE' && (
        <div className="text-sm text-gray-600 mt-2">
          Your video has been processed and is ready for streaming in multiple qualities.
        </div>
      )}
    </div>
  );
}