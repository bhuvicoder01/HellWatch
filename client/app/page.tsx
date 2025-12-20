'use client';

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
  const fetchFromServer = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/health');
      const data = await res.json();
      console.log('Health check:', data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };
  
  fetchFromServer();
}, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold mb-12 bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          🚀 HellWatch Streaming
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }, (_, i) => (
            <div 
              key={i} 
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 hover:bg-gray-800/70 transition-all duration-300 border border-gray-800 hover:border-red-500/50 group"
            >
              <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300"></div>
              <h3 className="font-semibold text-xl mb-2">Movie {i + 1}</h3>
              <p className="text-gray-400 text-sm">Action-packed thriller</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}


