'use client'
import React, { useState,useEffect, use, } from 'react'
import { useRef } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic'
function Register() {
    
    const toastRef = useRef<HTMLDivElement>(null);
    const navigate=useRouter().push;
    const formDataToSend = new FormData()
    const [formData,setFormData]=useState({
        username:'',
        email:'',
        password:'',
        isAdmin:'false'
    })
    const [avatar, setAvatar] = useState(null); // Separate state for file
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
     const [isLoading,setLoading]=useState(false);
    
    
    useEffect(()=>{
    if (typeof window !== 'undefined') {
        const user=localStorage.getItem('user')
        if(user){
          navigate('/')
        }
    }
    })


    useEffect(() => {
    if (success && toastRef.current) {
      const timer = setTimeout(() => {
        toastRef.current?.classList.remove("show");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [success]);
    
    const handleChange=async(e:any)=>{
        setFormData({
            ...formData,
            [e.target.name]:e.target.value
        })

    }

    const handleFileChange=(event:any)=>{
        const file=event.target.files[0];
        if(file){
            setAvatar(file);
        }
    }

    const handleSubmit = async (e:any) => {
         e.preventDefault();
        try {
            formDataToSend.append('username',formData.username)
            formDataToSend.append('email',formData.email)
            formDataToSend.append('password',formData.password)
            formDataToSend.append('isAdmin',formData.isAdmin)
            if(avatar){
                formDataToSend.append('Avatar',avatar)
            }
            const res = await api.post(`/auth/register`,formDataToSend,
                {headers: 
                    {
                        "Content-Type": "multipart/form-data", // Required for file uploads
        }},)
        setMessage(res.data.message || "Registration successful!");
        setFormData({ username: "", email: "", password: "", isAdmin: "false" });
        setAvatar(null); 
        setSuccess(true);

      // Show toast
      if (toastRef.current) {
        toastRef.current.classList.add("show");
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);

    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Something went wrong, please try again."
      );

    }
      // Hide toast after 2.5 seconds
  

}
    return (
        <>
            <div className='container d-flex justify-content-center align-items-center text-center'>
                <div
        ref={toastRef}
        className="toast position-fixed top-0 start-50 translate-middle-x mt-3 fade"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          zIndex: 9999,
          background: "rgba(255, 255, 255, 0.76)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
          minWidth: "280px",
        }}
      >
        <div className="toast-header border-0" style={{ background: "transparent" }}>
          <strong className="me-auto text-success fs-5">✅ Success</strong>
          <small className="">👽Registration Successful</small>
          <button
            type="button"
            className="btn-close"
            onClick={() => toastRef.current?.classList.remove("show")}
          ></button>
        </div>
        <div className="toast-body text-white fw-semibold text-center">
          {message}
        </div>
      </div>
                <div className='container-fluid d-flex justify-content-center align-items-center '>
                    <div className='card shadow rounded-lg p-2 'style={{width:'100%',maxWidth:'500px'}}>
                        <h5 className='text-danger fw-semibold'>Register👽</h5>
                        <div className='card-body'>
                            <form onSubmit={handleSubmit} className='form'>
                            <div className='mb-3'>
                                <label className='form-label' htmlFor='name'>Username:</label>
                                <input
                                    className='form-control'
                                    type='text'
                                    placeholder='Enter your username'
                                    name='username'
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className='mb-3'>
                                <label className='form-label' htmlFor='email'>Email:</label>
                                <input
                                className='form-control'
                                type='email'
                                placeholder='Enter your email'
                                name='email'
                                value={formData.email}
                                onChange={handleChange}
                                required
                                />
                            </div>
                            <div className='mb-3'>
                                <label className='form-label' htmlFor='password'>Password:</label>
                                <input
                                className='form-control'
                                type='password'
                                name='password'
                                value={formData.password}
                                onChange={handleChange}
                                required
                                />
                            </div>
                            <div className='mb-3'>
                                <label htmlFor='avatar' className='form-label'>Choose your avatar:</label>
                                <input
                                className='form-control'
                                type='file'
                                name='avatar'
                                onChange={handleFileChange}
                                required
                                />
                            </div>
                            <div className='mb-3'>
                                <label className='form-label' htmlFor='isAdmin'>Are you Admin:</label><br/>
                                <select className='form-select' name="isAdmin" id="isAdmin">
                                    <option value='false'>No</option>
                                    <option value='true'>Yes</option>
                                </select>
                            </div>
                            <div className='d-grid mb-4'>
                                <button type='submit' className='btn btn-danger' >Register</button>
                            </div>
                        </form>
                        </div>
                        

                    </div>
                </div>
            </div>
        </>
    )
}

export default Register