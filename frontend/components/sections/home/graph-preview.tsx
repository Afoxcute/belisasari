import Image from "next/image";

export default function GraphPreview() {
  return (
    <div className="flex flex-col-reverse lg:flex-row justify-between w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex-1 my-auto mx-auto lg:mx-0">
        <div className="w-full max-w-full overflow-hidden">
          <Image 
            src={`/graph.png`} 
            width={900} 
            height={400} 
            alt="graph" 
            className="w-full h-auto max-w-full"
            priority
          />
        </div>
      </div>
      <div className="lg:flex-1 flex flex-col lg:pb-8 xl:pb-12 flex-1 max-w-full lg:max-w-[70%] mx-auto px-4 sm:px-6 lg:px-0">
        <p className="font-bold nouns tracking-widest text-xl sm:text-2xl md:text-3xl lg:text-4xl text-text-main mt-8 sm:mt-12 lg:mt-16 xl:mt-24 text-center lg:text-right">
          Track Viral Posts with <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>Market Impact
        </p>
        <p className="sen text-text-secondary font-semibold lg:w-[90%] xl:w-[80%] lg:ml-auto mt-2 sm:mt-4 mb-8 sm:mb-12 lg:mb-16 text-xs sm:text-sm md:text-base lg:text-lg text-center lg:text-right">
          See the direct correlation between TikTok engagement and price
          movements. Our analytics track how viral TikTok content drives
          memecoin performance, helping you spot potential moonshots before they
          take off.
        </p>
      </div>
    </div>
  );
}
