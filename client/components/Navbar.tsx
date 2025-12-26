'use client';
import { useAuth} from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
    const {user,logout}=useAuth() 
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (showDropdown && dropdownRef && !dropdownRef.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [showDropdown, dropdownRef]);
    
    return (<>
        <div className="navbar">
            <div className="navbar_logo">
                <Link href="/">
                    <img src="/logo1.png" alt="logo" />
                </Link>
            </div>
            <div className="navbar-link">
                <Link href="/songs">Songs</Link>
                <Link href="/videos">Videos</Link>
                {/* <Link href="/videos/upload">VideoUpload</Link> */}
                <Link href="#">About</Link>
                <Link href="#">Contact</Link>
            </div>
            {/* <div className="navbar-actions">
                <select className="toogle-service">
                    <option value="video">Video</option>
                    <option value="song">Song</option>
                </select>
                </div> */}
            <div className="navbar-auth">
                <div className={`${user?._id ?'navbar-profile-active':'navbar-profile-inactive'}`} 
                     ref={setDropdownRef}
                     onClick={() => setShowDropdown(!showDropdown)}>
                    {user?._id?<img src={typeof user.avatar === 'string' ? user.avatar : (user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar ? (user.avatar as any).url : '')} alt="profile" style={{ cursor: 'pointer' }} />:<i className="bi bi-person-fill text-danger "></i>}
                    {showDropdown &&( (!user||user===null) ? (
                        <div className="profile-dropdown">
                            <Link href="/auth/login" className="dropdown-item">Login</Link>
                            <Link href="/auth/register" className="dropdown-item">Sign Up</Link>
                        </div>
                    ) : (   
                            <div className="profile-dropdown">
                                <Link href="/profile" className="dropdown-item">{user.username}</Link>
                                <Link href="/settings" className="dropdown-item">Settings</Link>
                                <button className="dropdown-item logout" onClick={logout}>Logout</button>
                            </div>)

                    )}
                </div>
            </div>
        </div>

    </>
    );
}