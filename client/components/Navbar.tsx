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
                <Link href="/videos">Videos</Link>
                <Link href="/videos/upload">Upload</Link>
                <Link href="#">About</Link>
                <Link href="#">Contact</Link>
            </div>
        </div>
    )
}