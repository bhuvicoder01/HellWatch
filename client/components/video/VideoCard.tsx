import { API_URL } from "@/services/api";
import Link from "next/link";

export default function VideoCard({Key, video, controls=false, detailPage=false }: {Key?: any, video: any, controls?: boolean, detailPage?: boolean }) {
    const handleMouseOver = async (e: React.MouseEvent<HTMLVideoElement>) => {
        if (!detailPage) {
            try {
                await e.currentTarget.play();
            } catch (error) {
                // Autoplay failed, user needs to interact first
            }
        }
    };
    
    return (<>
        <div key={Key}  className={`video-card ${detailPage ? 'no-hover' : ''}`}>
            {detailPage ? (
                <Link href={`/videos/details?id=${video.id}`}>
                <video controls={controls}>
                    <source src={`${API_URL}/videos/stream/${video.id}`} type="video/mp4" />
                </video>
                </Link>
            ) : (
                <Link href={`/videos/details?id=${video.id}`}>
                    <video onMouseOver={handleMouseOver}>
                        <source src={`${API_URL}/videos/stream/${video.id}`} type="video/mp4" />
                    </video>
                </Link>
            )}
            <div className="video-info">
                <h3 className="title">{video.key}</h3>
                <p className="description">{new Date(video.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
  </>  )
}