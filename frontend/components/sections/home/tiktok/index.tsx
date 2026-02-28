import TiktokSectionBody from "./body";
import TikTokCarousel from "./carousel";
import RealTimeTikTokFeed from "./real-time-feed";
import AnalyticsDashboard from "./analytics-dashboard";

export default function TiktokSection() {
  return (
    <div className="relative w-full">
      <div className="absolute w-full h-4 sm:h-6 lg:h-8 top-0 bg-gradient-to-b from-black/80 to-transparent z-10" />
      <div className="bg-muted-foreground transition duration-300 ease-in-out group hover:bg-primary">
        {/* <div className="flex flex-col lg:flex-row justify-between w-full px-4 sm:px-6 lg:px-8">
          <TiktokSectionBody />
          <TikTokCarousel />
        </div> */}
      </div>
      <div className="absolute w-full h-4 sm:h-6 lg:h-8 bottom-0 z-10" />
      
      {/* Real-time TikTok Feed */}
      <div className="mt-8 sm:mt-12 lg:mt-16 px-4 sm:px-6 lg:px-8">
        <RealTimeTikTokFeed />
      </div>
      
      {/* Analytics Dashboard */}
      <div className="mt-8 sm:mt-12 lg:mt-16 px-4 sm:px-6 lg:px-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
