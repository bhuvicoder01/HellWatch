'use client'
import { useState,useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

function Login() {
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const navigate=useRouter().push


     useEffect(()=>{
    const user=localStorage.getItem('user')
    if(user){
      navigate('/')
    }
})

    const handleSubmit=async()=>{
        try {
            const res=await api.post(`/auth/login`,{
                email,
                password
            })
            localStorage.setItem('user',JSON.stringify(res.data))

            navigate('/')

            
        } catch (error) {
            console.error(error);
            alert("Something went wrong!");
            
        }
    }
  return (
    
    <>
    <div className='container d-flex justify-content-center align-items-center'>
            <div className='card shadow-lg p-4 rounded-4'style={{width:'100%',maxWidth:'500px'}}>
                <h5 className='text-center mb-4 text-primary'>Login👽</h5>
                <div className='card-body'>
                    <form action={handleSubmit}>
                        <div className='mb-3'>
                        <label htmlFor='email' className='form-label'>Email:</label>
                        <input
                        className='form-control'
                        type='email'
                        name='email'
                        onChange={(e)=>setEmail(e.target.value)}
                        />
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='password' className='form-label'>Password:</label>
                            <input
                            className='form-control'
                            type='password'
                            name='password'
                            onChange={(e)=>setPassword(e.target.value)}
                            />
                        </div>
                        <div className='d-grid mb-3'>
                        <button type='submit' className='btn btn-primary my-1 w-100'>Login</button>
                        </div>
                    </form>


                </div>
        </div>
    </div>
    </>
  )
}

export default Login