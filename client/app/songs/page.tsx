'use client'
import VideoCard from "@/components/video/VideoCard"
import { api } from "@/services/api"
import { useEffect, useState } from "react"

export default function SongsPage() {
    const [songs, setSongs] = useState<any[]>([])

const getAudios=async()=>{
        const res=await api.get('/songs')
        const data=await res.data
        return data
    }
    useEffect(() => {
        getAudios().then((data) => {
            setSongs(data)
        })
    }, [])

    

    return(<>
    <div className="d-flex">
        <div className="card flex-fill">
            <div className="card-body">
                <h5 className="card-title">Songs</h5>
                <p className="card-text">List of songs</p>
            </div>
            {songs && <div className={`video-grid flex flex-column gap-4 `}>
                        {songs.map((video: any) => (
                            <VideoCard key={video?.id} video={video} />
                        ))}
                    </div>}
        </div>
    </div>
    
    </>)
}