'use client';

import { useEffect } from "react";
import {api} from "@/services/api"
import VideosPage from "./videos/page";

export default function Home() {
  useEffect(() => {
  const fetchFromServer = async () => {
    try {
      const res = await api.get('/health');
      const data = await res.data;
      console.log('Health check:', data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };
  
  fetchFromServer();
}, []);

  return (<>
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-10 ">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold mb-12 bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          🚀 HellWatch Streaming
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
         <VideosPage/>
        </div>
      </div>
    </main>
    
    </>
  )
}


