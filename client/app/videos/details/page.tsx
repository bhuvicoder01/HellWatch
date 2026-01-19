'use client'
import VideoCard from "@/components/video/VideoCard";
import VideoGrid from "@/components/video/VideoGrid";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { useSong, useVideo } from "@/contexts/MediaContext";
import { api } from "@/services/api";
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense, useMemo } from "react";
import VideosPage from "../page";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsDown, faThumbsUp } from "@fortawesome/free-solid-svg-icons";

function VideoDetailsContent() {
    const {Videos}=useVideo()
    const [videos,setVideos]=useState(Videos);
    const [video,setVideo]=useState<any>(null);
    const [windowWidth, setWindowWidth] = useState(0);
    const [showEdit, setShowEdit] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(video?.title);
    const { refreshVideos } = useVideo();
    const {user}=useAuth()
    const {currentSong,setCurrentSong}=useSong()
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);


    
    const id=useSearchParams().get('id')||'';
    
    useMemo(() => {
      setVideos(Videos);
    }, [Videos]);

     useEffect(() => {
    if (video) {
      document.title = `${video.title} by ${video?.owner?.username} | HellWatch`;
    } else {
      document.title = 'HellWatch';
    }
  }, [video]);
    
    useEffect(() => {
        if (id) {
            getVideoData(id);
            setCurrentSong(null)
            if(typeof window!=='undefined'){
                localStorage.removeItem('currentSong')
                localStorage.removeItem('currentTime')
            }
        }
        const handleResize = () => setWindowWidth(window.innerWidth);
        setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

     useEffect(()=>{
        if(video?.popularity){
            const likedEntry = Object.entries(video?.popularity).find(([key, value]) => (value === 'liked')&&(key===user?._id));
            const dislikedEntry = Object.entries(video?.popularity).find(([key, value]) => (value === 'disliked')&&(key===user?._id));

            if (likedEntry) {
                console.log('liked')
                setLiked(true);
            } else {
                setLiked(false);
            }

            if (dislikedEntry) {
                console.log('disliked')
                setDisliked(true);
            } else {
                setDisliked(false);
            }
        }
    },[video])

    const getVideoData = async (id: string) => {
        try {
            const res=await api.get(`/videos/${id}`);
            setVideo(res.data);
            setEditTitle(res.data.title||res.data.key);
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

    const handleAction=async(action:string)=>{
        if(action==='liked'){
            await api.put(`/videos/${video.id}/actions?liked=1&disliked=0`,{userId:user?._id})
            getVideoData(id)
        }
        else if(action==='disliked'){
            await api.put(`/videos/${video.id}/actions?liked=0&disliked=1`,{userId:user?._id})
            getVideoData(id)
        }
        
    }
    
   

    if(!video){
        return <div>Loading...</div>
    }
   
    
    return (<>
        <div className="d-flex flex-column flex-lg-row mb-5" style={{gap: '20px'}}>
            <div className="flex-grow-1">
                <CustomVideoPlayer videoId={video.id} title={video.title} />
                <div className="mt-3">
                    {showEdit&&video?.owner?.id===user?._id && (
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
                    <span className="d-flex " style={{alignItems:'center',fontSize:'14px',maxHeight:'30px'}}>Uploaded by:{<img className="profile-img" style={{maxHeight:'30px',minHeight:'30px',minWidth:'30px',width:'30px',height:'30px',borderRadius:'50%',objectFit:'cover',objectPosition:'center',maxWidth:'30px'}} src={video?.owner?.pic?video?.owner?.pic:undefined}/>}<Link className="text-decoration-none text-white" style={{fontFamily:'-apple-system'}} href={`/public/profile?id=${video?.owner?.id}`}>{video?.owner?.username}</Link></span>
                    <h2 className="title">{video?.title}</h2>
                    <div className="d-flex" style={{flexDirection:'row',alignItems:'center'}}>
                        <button title="like" onClick={(e)=>{e.currentTarget.blur();handleAction('liked')}} onTouchEnd={(e)=>{e.currentTarget.blur();handleAction('liked')}} className={`action-btn ${liked?'video-liked':''}`}><FontAwesomeIcon icon={faThumbsUp} /><span className="text-white">{video?.stats?.likes||0}</span></button>
                        <button title="dislike " onClick={(e)=>{e.currentTarget.blur();handleAction('disliked')}} onTouchEnd={(e)=>{e.currentTarget.blur();handleAction('disliked')}} className={`action-btn ${disliked?'video-disliked':''}`}><FontAwesomeIcon icon={faThumbsDown}/><span className="text-white">{video?.stats?.dislikes||0}</span></button>
                    </div>
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
                {videos?.length!==0 && <VideosPage mobileDisplay={window.innerWidth<992?true:false} detailsPage={true}/>}
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
            }
            .video-info {
                margin-top: 20px;
            }

            .title {
                font-size: 24px;
                margin-bottom: 8px;
                color: #ffffffff;
            }

            .description {
                font-size: 16px;
                color: #6c757d;
            }
            
            .action-btn {
                background: transparent;
                border: none;
                color: #6c757d;
                padding: 8px 12px;
                margin-right: 10px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .action-btn.video-liked,
            .action-btn.video-disliked {
                color: #ff0019;
            }
            
            @media (hover: hover) {
                .action-btn:hover {
                    color: rgb(255, 0, 0);
                }
               
            }
                `
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