'use client';

import { useEffect } from "react";
import Video from "./videos/page";

export default function Home() {
  useEffect(() => {
  const fetchFromServer = async () => {
    try {
      const api=process.env.NEXT_PUBLIC_API_URL
      console.log("API URL:", api);
      const res = await fetch('http://localhost:5000/health');
      const data = await res.json();
      console.log('Health check:', data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };
  
  fetchFromServer();
}, []);

  return (<>
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 p-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold mb-12 bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          🚀 HellWatch Streaming
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
         <Video/>
        </div>
      </div>
    </main>
    
    </>
  )
}


