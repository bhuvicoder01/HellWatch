'use client'
import { api } from "@/services/api"
import { useEffect, useState } from "react"

export default function Page(){
    const [page,setPage]=useState<string>('')

    useEffect(()=>{
        const fetchFromServer = async () => {
            try {
              const res = await api.get('/page');
              const data = await res.data;
              console.log('page:', data);
              setPage(data);
            } catch (error) {
              console.error('Failed to fetch page:', error);
            }
          };
          
          fetchFromServer();
    },[])

    return page ? <div dangerouslySetInnerHTML={{ __html: page }} /> : <div>Loading...</div>
}