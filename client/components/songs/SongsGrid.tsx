import { SongContextType } from "@/contexts/MediaContext";
import SongsCard from "./SongsCard";

export default function SongsGrid({songs}:{songs:any[]}){

    return(
        <div className="song-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {songs.map((song:SongContextType)=>{
            return <SongsCard key={song.id} song={song}/>
           })}
        </div>
    )
}