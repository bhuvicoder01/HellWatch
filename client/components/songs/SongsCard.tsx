'use client'
import { SongContextType, useSong } from "@/contexts/MediaContext";
import { api } from "@/services/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SongsCard({ song }: { song:SongContextType  }) {
    const [thumbnail,setThumbnail]=useState<string|Blob|null>(null);
    const [showThumbnail,setShowThumbnail]=useState(true)
    const {Songs,currentSong,setCurrentSong}=useSong()

   const fetchThumbnail = async () => {
            try {
                const res = await api.get(`/songs/${song.id}/thumbnail`, {
                    responseType: 'blob',
                });
                const blob = res.data;
                const url = URL.createObjectURL(blob);
                setThumbnail(url);
            } catch (error) {
                console.error('Error fetching thumbnail:', error);
            }
        };
    useEffect(()=>{
        fetchThumbnail()
        // console.log(song,currentSong)
    },[song.id,currentSong])

    const handleSongStart=async()=>{
        const foundSong = Songs.find((s:SongContextType) => s.id === song.id);
        if (foundSong) {
            if(typeof window !=='undefined'){
                localStorage.removeItem('currentTime')
            }
            setCurrentSong(foundSong);
            
        }
        // console.log(currentSong)
    }
    return (
        <div className="song-card flex flex-col items-center justify-center w-full h-full"style={{transform:`scale(${song.id===currentSong?.id?'1.07':'1'})`,  boxShadow:`${song.id===currentSong?.id?'0 2px 12px rgba(255, 0, 0, 1)':'none'}`}} >
            <Link href={`/songs?play=${song.id}`} >
{showThumbnail && song.thumbnail&& <img src={thumbnail as string} alt={song.title} className="thumbnail" onError={()=>setShowThumbnail(false)} />}
</Link>
        <div className="song-info"style={{justifyContent:'center',alignItems:'center'}}>
                <h1 className="title">{song.title}</h1>
                <p className="description d-flex"style={{flexDirection:'column',alignItems:'center'}} >Published by {<img className="profile-img" style={{maxHeight:'30px',minHeight:'30px',minWidth:'30px',width:'30px',height:'30px',borderRadius:'50%',objectFit:'cover',objectPosition:'center',maxWidth:'30px'}} src={song?.owner?.pic?song?.owner?.pic:undefined}/>}<Link className='text-decoration-none text-white'style={{fontFamily:'-moz-initial'}} href={`/public/profile?id=${song?.owner?.id}`}>{song.owner?.username}</Link></p>
            </div>
        </div>
    )
}