'use client'
import SongsGrid from "@/components/songs/SongsGrid"
import VideoCard from "@/components/video/VideoCard"
import { useSong } from "@/contexts/MediaContext"
import { api } from "@/services/api"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function SongsPage() {
const {Songs,refreshSongs}=useSong()

    useEffect(()=>{
refreshSongs()
    },[])
    

    return(<>
    <button className="btn btn-danger">
             <Link href="/songs/upload" className="nav-link">Upload songs</Link>
        </button>
    <div className="d-flex"style={{flexDirection:'column'}}>
        
        <div className="card-body">
                <h5 className="card-title">Songs</h5>
                <p className="card-text">List of songs</p>
            </div>
        <div className="card song-grid song flex-fill">
            
            {Songs && <SongsGrid songs={Songs}/>}
        </div>
    </div>
    
    </>)
}