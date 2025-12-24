'use client'
import VideoCard from "@/components/video/VideoCard";
import VideoGrid from "@/components/video/VideoGrid";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { useVideo } from "@/contexts/VideoContext";
import { api } from "@/services/api";
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense, useMemo } from "react";
import VideosPage from "../page";

function VideoDetailsContent() {
    const {Videos}=useVideo()
    const [videos,setVideos]=useState(Videos);
    const [video,setVideo]=useState<any>(null);
    const [windowWidth, setWindowWidth] = useState(0);
    const [showEdit, setShowEdit] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(video?.title);
    const { refreshVideos } = useVideo();


    
    const id=useSearchParams().get('id');
    
    useMemo(() => {
      setVideos(Videos);
    }, [Videos]);
    
    useEffect(() => {
        if (id) {
            getVideoData(id);
        }
        const handleResize = () => setWindowWidth(window.innerWidth);
        setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    const getVideoData = async (id: string) => {
        try {
            const res=await api.get(`/videos/${id}`);
            setVideo(res.data);
            setEditTitle(res.data.title);
            return res.data;
        } catch (error) {
            console.error('Error fetching video data:', error);
            return null;
        }
    }
    
        const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this video?')) {
            try {
                await api.delete(`/videos/${video.id}`);
                refreshVideos();
            } catch (error) {
                console.error('Error deleting video:', error);
            }
        }
    };

    const handleEdit = async () => {
        try {
            await api.put(`/videos/${video.id}`, { title: editTitle });
            setVideo({ ...video, title: editTitle });
            setIsEditing(false);
            refreshVideos();
        } catch (error) {
            console.error('Error updating video:', error);
        }
    };
    if(!video){
        return <div>Loading...</div>
    }
    
    return (<>
        <div className="d-flex flex-column flex-lg-row mb-5" style={{gap: '20px'}}>
            <div className="flex-grow-1">
                <CustomVideoPlayer videoId={video.id} title={video.title} />
                <div className="mt-3">
                    {showEdit && (
                        <div className="edit-controls">
                            <button onClick={() => setIsEditing(!isEditing)} className="edit-btn">
                                ✏️
                            </button>
                            <button onClick={handleDelete} className="delete-btn">
                                🗑️
                            </button>
                        </div>
                    )}
                     <div className="video-info">
                {isEditing ? (
                    <div className="edit-form">
                        <input 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="edit-input"
                        />
                        <button onClick={handleEdit} className="save-btn">Save</button>
                        <button onClick={() =>{ setIsEditing(false)
                            setEditTitle(video?.title)
                        }} className="cancel-btn">Cancel</button>
                    </div>
                ) : (
                    <>
                    <h2 className="title">{video?.title}</h2>
                        {/* <h3 className="title">{video.key}</h3> */}
                        <p className="description">{new Date(video.createdAt).toLocaleDateString()}</p>
                    </>
                )}
            </div>
                    {/* <h3>{video?.title}</h3>
                    <p className="text-muted">Uploaded: {new Date(video.createdAt).toLocaleDateString()}</p> */}
                </div>
            </div>
            <div className="rows-lg-4" style={{maxWidth: '100%'}}>
                {videos.length!==0 && <VideosPage mobileDisplay={window.innerWidth<992?true:false} detailsPage={true}/>}
            </div>
        </div>
        <style jsx>{
            ` .edit-controls {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                margin-left: 8px;
            }
            
            .edit-btn, .delete-btn {
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .edit-btn {
                background: #007bff;
                color: white;
            }
            
            .delete-btn {
                background: #dc3545;
                color: white;
            }
            
            .edit-form {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .edit-input {
                padding: 4px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            
            .save-btn, .cancel-btn {
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .save-btn {
                background: #28a745;
                color: white;
            }
            
            .cancel-btn {
                background: #6c757d;
                color: white;
            }`
        }</style>
  </>  )
}

export default function VideoDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VideoDetailsContent />
        </Suspense>
    )
}