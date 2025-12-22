import Link from "next/link";

export default function Navbar() {
    return (
        <div className="navbar">
            <div className="navbar_logo">
                <Link href="/">
                <img src="/logo1.png" alt="logo" />
              </Link>
            </div>
            <div className="navbar-link">
                <a href="/videos">Videos</a>
                <a href="/videos/upload">Upload</a>
                <a href="#">About</a>
                <a href="#">Contact</a>
            </div>
        </div>
    )
}