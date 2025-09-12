import Image from "next/image";
import CRTEffect from "@/components/crteffect";
import PixelBlast from "@/components/backgrounds/PixelBlast/PixelBlast";

export default function Home() {
  return (
    <div className="w-screen h-screen bg-black">
      {/* <CRTEffect
        curvature={20}
        scanlines={0.2}
        glow={0.2}
        brightness={1}
        contrast={1.7}
        noise={0.3}
        vignette={2}
        chromaticAberration={0.03}
        scanlineSpeed={1.8}
      >
        <div className="w-screen h-screen">
          <img
            src="/lain.jpg"
            alt="Your Image"
            className="h-[100vh] mt-[15vh] ml-[40vw]"
          />
        </div>
      </CRTEffect> */}
      {/* <PixelBlast
        variant="square"
        pixelSize={6}
        color="#00FF11"
        patternScale={8}
        patternDensity={1.35}
        pixelSizeJitter={20}
        enableRipples
        rippleSpeed={0.5}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        speed={0.6}
        edgeFade={0.1}
        transparent
      /> */} {/* <LineDither
        src="/sample2.jpg"
        lineSpacing={15}
        minLineWidth={-0.5}
        maxLineWidth={1.5}
        useImageColors={true}
        animationSpeed={2}
        color="#00ff11"
        waveAmplitude={2}
        glowIntensity={0.2}
        lineDirection="both"
        wavelength={200}
        width={1912}
        height={1072}
      /> */}
    </div>
  );
}
