'use client'
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function ProfilePage() {
    const {user,update}=useAuth()
    const formData=new FormData()

    const handleFileChange=async(e:any)=>{
        const file=e.target.files[0]
        if(file){
            console.log(file)
            formData.append('Avatar',file)
            await update(formData)
            formData.delete('Avatar')
        }
    }

    return(<>
    <div className="container-fluid mt-2 "style={{gap:'20px'}}>
        <div className="card profile-card text-center">
            <img src={user?.avatar?.url} className="profile-img" alt="avatar"/>
            <form > 
               <label htmlFor="avatar" className="btn btn-secondary mt-2" style={{transform:'scale(0.8)'}}>Change Avatar</label>
               <input className="d-none" onChange={handleFileChange}  type="file" name="avatar" id="avatar" accept="image/*" />
            </form>
            {/* <h1>Profile</h1> */}
            <text style={{fontFamily:'-apple-system'}}>{user?.username}</text>
             <p>{user?.email}</p>
        </div>
        <div className="card profile-card">
        </div> 
    </div>

  </>  )

}