import VideoCard from "./VideoCard";

export default function VideoGrid({ videos, detailsPage=false,mainVideo=false, mobileDisplay=false }: { videos: any[], detailsPage?: boolean,mainVideo?:boolean, mobileDisplay?: boolean }) {
    console.log(detailsPage,mobileDisplay)
    return (
        <div className={`video-grid ${(detailsPage && !mobileDisplay) ? 'flex flex-column gap-4 ' : (true ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8' : 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8')}`}>
            {videos.map((video) => (
                <VideoCard key={video.id} mainVideo={mainVideo} detailPage={detailsPage} video={video} />
            ))}
        </div>
    )
}
