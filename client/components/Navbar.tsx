'use client';
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
    const user = undefined;
    const [showDropdown, setShowDropdown] = useState(false);
    return (<>
        <div className="navbar">
            <div className="navbar_logo">
                <Link href="/">
                    <img src="/logo1.png" alt="logo" />
                </Link>
            </div>
            <div className="navbar-link">
                <Link href="/videos">Videos</Link>
                <Link href="/videos/upload">Upload</Link>
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
                <div className="navbar-profile" onClick={() => setShowDropdown(!showDropdown)}>
                    <img src={`${user?.avatar ? user.avatar : '/default-avatar.png'}`} alt="profile" style={{ cursor: 'pointer' }} />
                    {showDropdown &&( user===undefined ? (
                        <div className="profile-dropdown">
                            <Link href="/auth/login" className="dropdown-item">Login</Link>
                            <Link href="/auth/register" className="dropdown-item">Sign Up</Link>
                        </div>
                    ) : (   
                            <div className="profile-dropdown">
                                <Link href="/profile" className="dropdown-item">My Profile</Link>
                                <Link href="/settings" className="dropdown-item">Settings</Link>
                                <button className="dropdown-item logout" onClick={() => console.log('Logout')}>Logout</button>
                            </div>)

                    )}
                </div>
            </div>
        </div>

    </>
    );
}