'use client'
import { API_URL } from "@/services/api"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

 export function SongDetails() {
    const id=useSearchParams().get('id')
    console.log(id)
  return (<>
    <div>SongDetailsPage</div>
    {/* <audio src={`${API_URL}/songs/stream/${id}`} controls autoPlay /> */}
    </>
  )
}
export default function SongDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
        <SongDetails/>
        </Suspense>
    )
}