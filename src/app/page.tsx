import NewspaperDither from "@/components/newspaperdither";

export default function Home() {
  return (
    <div className="w-screen h-screen bg-black saturate-500">
      <NewspaperDither
        src="/deathnote.mp4"
        isVideo={true}
        dotDistance={9}
        minDotSize={0}
        maxDotSize={5.5}
        width={1912}
        height={1072}
        saturation={0.7}
        contrast={1.3}
      />
    </div>
  );
}
