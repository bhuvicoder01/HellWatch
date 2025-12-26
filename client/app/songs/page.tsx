'use client'
import SongsGrid from "@/components/songs/SongsGrid"
import VideoCard from "@/components/video/VideoCard"
import { useSong } from "@/contexts/MediaContext"
import { api } from "@/services/api"
import { useEffect, useState } from "react"

export default function SongsPage() {
const {Songs}=useSong()
    

    return(<>
    <div className="d-flex">
        <div className="card flex-fill">
            <div className="card-body">
                <h5 className="card-title">Songs</h5>
                <p className="card-text">List of songs</p>
            </div>
            {Songs && <SongsGrid songs={Songs}/>}
        </div>
    </div>
    
    </>)
}