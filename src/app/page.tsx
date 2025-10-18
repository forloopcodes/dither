import PixelText from "@/components/pixeltext";

export default function Home() {
  return (
    <div className="w-screen h-screen bg-black">
      <PixelText
        src="/meme.mp4"
        isVideo
        pixelSize={25}
        contrast={1.4}
        saturation={0.9}
        backgroundColor="#050505"
      />
    </div>
  );
}
