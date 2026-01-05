'use client'
import VideoCard from "@/components/video/VideoCard";
import VideoGrid from "@/components/video/VideoGrid";
import { useAuth, User } from "@/contexts/AuthContext";
import { publicAPI } from "@/services/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ProfilePageContent() {
    const [user,setUser]=useState<User|null>(null)
    const id=useSearchParams().get('id')
    const [userVideos,setUserVideos]=useState([])

    const getUser=async()=>{
        try {
            const res=await publicAPI.getUser(id)
            if(res.data){
                setUser(res.data.user)
            }
            
        } catch (error) {
            console.log(error)
            
        }
    }

    const getUserVideos=async()=>{
        try {
            const res=await publicAPI.getUserVideos(id);
            if(res.data){
                setUserVideos(res.data.videos)
            }

        } catch (error) {
            
        }
    }
    useEffect(()=>{
        getUser()
        getUserVideos()
    },[id])

    

    return(<>
    <div className="container-fluid mt-2 "style={{gap:'20px'}}>
        <div className="card profile-card text-left p-2"style={{justifyContent:'left'}}>
            <img src={user?.avatar?.url} className="profile-img" alt="avatar"/>
          
            {/* <h1>Profile</h1> */}
            <text style={{fontFamily:'-apple-system'}}>{user?.username}</text>
             <p>{user?.email}</p>
        </div>
        <div className="card profile-card overflow-scroll px-2 py-2">
            <h1>Video Posts</h1>
            <div className="card-body video-grid ">
              {userVideos &&
            //   (userVideos.map((video,index)=>{   
            //     return <VideoCard Key={index} video={video}/>

            //   }))
            <VideoGrid videos={userVideos}/>
                
                  
              }
            </div>
        </div> 
    </div>

  </>  )

}

export default function ProfilePage(){
    return (<Suspense fallback={<div>Loading...</div>}>
    <ProfilePageContent/> 
        
    </Suspense>
)
} 