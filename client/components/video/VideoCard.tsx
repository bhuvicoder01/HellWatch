import { api, API_URL } from "@/services/api";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useVideo } from "@/contexts/VideoContext";

export default function VideoCard({Key,mainVideo=false,showEdit, video, controls=false, detailPage=false }: {Key?: any, mainVideo?: boolean, showEdit?: boolean, video: any, controls?: boolean, detailPage?: boolean }) {

    const [videoData, setVideoData] = useState(video);
    const [showThumbnail, setShowThumbnail] = useState(true);
    const [thumbnail,setThumbnail]=useState<string|Blob|null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const { refreshVideos } = useVideo();

    const fetchThumbnail = async () => {
            try {
                const res = await api.get(`/videos/${video.id}/thumbnail`, {
                    responseType: 'blob',
                });
                const blob = res.data;
                const url = URL.createObjectURL(blob);
                setThumbnail(url);
            } catch (error) {
                console.error('Error fetching thumbnail:', error);
            }
        };
    const getVideoData = async (id: string) => {
                try {
                    const res=await api.get(`/videos/${id}`);
                    setVideoData(res.data);
                    return res.data;
                } catch (error) {
                    console.error('Error fetching video data:', error);
                    return null;
                    
                }
            }
    
    useEffect(() => {
        fetchThumbnail();
        getVideoData(video.id);
        setEditTitle(video.key || '');
    }, [video.id]);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [videoData.id]);
    
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this video?')) {
            try {
                await api.delete(`/videos/${videoData.id}`);
                refreshVideos();
            } catch (error) {
                console.error('Error deleting video:', error);
            }
        }
    };

    const handleEdit = async () => {
        try {
            await api.put(`/videos/${videoData.id}`, { title: editTitle });
            setVideoData({ ...videoData, title: editTitle });
            setIsEditing(false);
            refreshVideos();
        } catch (error) {
            console.error('Error updating video:', error);
        }
    };
    
    const handleMouseOver = async () => {
        if (!detailPage && videoRef.current) {
            setShowThumbnail(false);
            try {
                await videoRef.current.play();
            } catch (error) {
                // Autoplay failed
            }
        }
    };

    const handleMouseLeave = () => {
        if (!detailPage && videoRef.current) {
            setShowThumbnail(true);
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };
    
    return (<>
        <div key={Key}  className={`video-card ${detailPage ? 'no-hover' : ''}`}>
            {detailPage ? mainVideo ? (
                <div>
                    <Link href={`/videos/details?id=${videoData.id}`}>
                    <video ref={videoRef} controls={controls}>
                        <source src={`${API_URL}/videos/stream/${videoData.id}`} type="video/mp4" />
                    </video>
                    </Link>
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
                </div>
            ):
            <div>
            <i className=""></i>
            <video ref={videoRef} controls={controls}>
                    <source src={`${API_URL}/videos/stream/${videoData.id}`} type="video/mp4" />
                </video>
                </div>
             : (
                <Link href={`/videos/details?id=${videoData.id}`}>
                    <div className="video-container" onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
                        {showThumbnail && videoData.thumbnail && (
                            <img
                                src={thumbnail as string}
                                alt="Video thumbnail"
                                className="thumbnail"
                                onError={() => setShowThumbnail(false)}
                            />
                        )}
                        <video 
                            ref={videoRef}
                            style={{ display: showThumbnail ? 'none' : 'block' }}
                            muted
                        >
                            <source src={`${API_URL}/videos/stream/${videoData.id}`} type="video/mp4" />
                        </video>
                    </div>
                </Link>
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
                        <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                    </div>
                ) : (
                    <>
                    <h2 className="title">{videoData?.title}</h2>
                        <h3 className="title">{videoData.key}</h3>
                        <p className="description">{new Date(videoData.createdAt).toLocaleDateString()}</p>
                    </>
                )}
            </div>
        </div>
        
        <style jsx>{`
            .video-container {
                position: relative;
                width: 100%;
                height: 200px;
                overflow: hidden;
                border-radius: 8px;
            }
            
            .thumbnail {
                width: 100%;
                height: 100%;
                object-fit: cover;
                cursor: pointer;
            }
            
            .edit-controls {
                display: flex;
                gap: 8px;
                margin-top: 8px;
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
            }
        `}</style>
  </>  )
}