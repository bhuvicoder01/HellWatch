'use client'
import axios from "axios";
import { useState } from "react";
import {api} from "@/services/api";

export default function VideoUploader() {
  const [progress, setProgress] = useState(0);
  // const [videoUrl, setVideoUrl] = useState("");

  const handleChange = async (e:any) => {
  try{  const file = e.target.files[0];
    if (!file) return;

    // 1. Ask backend for presigned URL
    const res = await api.get("/videos/upload-url", {
      params: { fileName: file.name, fileType: file.type }
    });

    const { uploadUrl, fileUrl } = res.data;

    // 2. Upload directly to S3
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (evt) => {
        if (evt.total) {
          setProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      }
    });

    // setVideoUrl(fileUrl); // save to DB if you need to associate with user etc.
    }
    catch(error){
      alert(error)

    }
  };

  return (
    <>
    
    <div>
      <input type="file" accept="video/*" onChange={handleChange} />
      {progress > 0 && <p>Upload: {progress}%</p>}
      {/* {videoUrl && <video src={videoUrl} controls width="400" />} */}
    </div>
    
    {/* {<VideoListPlayer/>} */}
    
   

    </>
  );
}
