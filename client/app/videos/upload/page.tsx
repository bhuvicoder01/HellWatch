'use client'
import axios from "axios";
import { useState } from "react";
import {api} from "@/services/api";
import MultipartUpload from "@/services/multipartUpload";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { useVideo } from "@/contexts/MediaContext";

export default function VideoUploader() {
  const {refreshVideos}=useVideo()
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [fileKey, setFileKey] = useState<string | null>(null);
  
  const { uploadRate, ws } = useUploadProgress(fileKey);

  const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB

  const generateVideoThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        // Set random time (10-80% of video duration)
        const randomTime = video.duration * (0.1 + Math.random() * 0.7);
        video.currentTime = randomTime;
      };
      
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      video.onerror = () => reject(new Error('Video load error'));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setProgress(0);
    }
  };

  const uploadVideo = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setMessage('Starting upload...');

    try {
      let key: string;
      
      // Use multipart upload for large files
      if (file.size > MULTIPART_THRESHOLD) {
        setMessage('Preparing multipart upload...');
        const multipartUpload = new MultipartUpload(file);
        
        // Set key for WebSocket tracking
        await multipartUpload.initiate();
        setFileKey(multipartUpload.key);
        
        const result = await multipartUpload.upload((loaded: number, total: number) => {
          const progressPercent = (loaded / total) * 100;
          setProgress(progressPercent);
          setMessage(`Uploading: ${(loaded / (1024 * 1024)).toFixed(1)}MB / ${(total / (1024 * 1024)).toFixed(1)}MB`);
        });
        
        key = multipartUpload.key!;
      } else {
        // Use regular upload for smaller files
        const res = await api.get("/videos/upload-url", {
          params: { 
            fileName: file.name, 
            fileType: file.type,
            fileSize: file.size
          }
        });

        const { uploadUrl, fileKey } = res.data;
        key = fileKey;
        setFileKey(key);
        setMessage('Uploading video...');

        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          }
        });
      }

      setMessage('Generating thumbnail...');
      
      let thumbnailBlob = null;
      try {
        thumbnailBlob = await generateVideoThumbnail(file);
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
      
      setMessage('Processing video...');

      const formData = new FormData();
      formData.append('key', key);
      formData.append('title', file.name);
      if (thumbnailBlob) {
        formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
      }
      
      const completeRes = await api.post('/videos/complete-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(`Upload complete! Final rate: ${completeRes.data.finalUploadRate} MB/s`);
      
      setFile(null);
      setProgress(0);
      setFileKey(null);
      refreshVideos()
      
    } catch (error:any) {
      console.error('Upload error:', error?.message);
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Video</h1>
      
      <div className="upload-form">
        <label htmlFor="file-input" className="btn btn-secondary file-label">
          Select a video file 📂
        </label>
        <input 
          type="file" 
          accept="video/*" 
          id="file-input"
          name="file-input"
          onChange={handleChange}
          disabled={uploading}
          className="d-none file-input"
        />
        
        {file && (
          <div className="file-info">
            <p><strong>Selected:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {file.type}</p>
            <p><strong>Upload Method:</strong> {file.size > MULTIPART_THRESHOLD ? 'Multipart (Large File)' : 'Direct Upload'}</p>
          </div>
        )}

        <button
          onClick={uploadVideo}
          disabled={!file || uploading}
          className="upload-btn"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-info">
              <span>{progress.toFixed(1)}%</span>
              <span>{uploadRate} MB/s</span>
            </div>
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        .upload-container {
          max-width: 600px;
          margin: 40px auto;
          padding: 30px;
          background: var(--bg-card);
          color: #ff0000e0;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
          text-align: center;
          color: #ff0000e0;
          margin-bottom: 30px;
        }
        
        .upload-form > * {
          margin-bottom: 20px;
        }
        
        .file-input {
          width: 100%;
          padding: 12px;
          border: 2px dashed #ffffffff;
          border-radius: 8px;
          background: #4d4d4d88;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        
        .file-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .file-info {
          padding: 15px;
          background: #4d4d4d88;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .file-info p {
          margin: 5px 0;
          color: #f31818df;
        }
        
        .upload-btn {
          width: 100%;
          padding: 15px;
          background: #ff0000ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .upload-btn:hover:not(:disabled) {
          background: #b30000ff;
        }
        
        .upload-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .upload-progress {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .progress-bar {
          width: 100%;
          height: 24px;
          background: #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.3s ease;
          border-radius: 12px;
        }
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          color: #555;
        }
        
        .message {
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
        }
        
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
}
