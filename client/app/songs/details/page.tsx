'use client'
import { API_URL } from "@/services/api"
import { useSearchParams } from "next/navigation"

export default function SongDetailsPage() {
    const id=useSearchParams().get('id')
    console.log(id)
  return (<>
    <div>SongDetailsPage</div>
    {/* <audio src={`${API_URL}/songs/stream/${id}`} controls autoPlay /> */}
    </>
  )
}