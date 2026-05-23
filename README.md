# Dither Effects Library

A collection of React components for creating retro, artistic, and interactive visual effects using Three.js and Canvas 2D. Perfect for creating nostalgic CRT displays, newspaper-style halftone patterns, and animated pixel art.

## Features

- **CRTEffect**: Apply authentic CRT monitor effects with scanlines, glow, and chromatic aberration
- **LineDither**: Create animated line-based dithering patterns from images
- **DotDither**: Generate animated dot-based dithering effects
- **PixelBlast**: Interactive pixel-based background with ripples and liquid effects
- **GlowingPixels**: Render images and videos as individual glowing pixels
- **NewspaperDither**: Mimic newspaper halftone printing with customizable dot patterns
- **PixelText**: Render images and videos as ASCII art pixels using Geist Mono font with GPU acceleration
- **WordleShader**: Transform video frames into grids of valid Wordle words colored by luminance

## Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Components

### CRTEffect

Applies CRT monitor effects to any React content, simulating the look of old computer displays.

#### Props

| Prop                  | Type        | Default | Description                     |
| --------------------- | ----------- | ------- | ------------------------------- |
| `children`            | `ReactNode` | -       | Content to apply CRT effects to |
| `curvature`           | `number`    | `0.15`  | Screen curvature amount (0-1)   |
| `scanlines`           | `number`    | `0.04`  | Scanline intensity (0-1)        |
| `glow`                | `number`    | `0.6`   | Phosphor glow effect (0-1)      |
| `brightness`          | `number`    | `1.2`   | Overall brightness multiplier   |
| `contrast`            | `number`    | `1.1`   | Contrast adjustment             |
| `noise`               | `number`    | `0.05`  | Random noise amount (0-1)       |
| `vignette`            | `number`    | `0.3`   | Edge darkening effect (0-1)     |
| `chromaticAberration` | `number`    | `0.003` | RGB color separation            |
| `scanlineSpeed`       | `number`    | `1.0`   | Animation speed of scanlines    |

#### Usage

```tsx
import CRTEffect from "@/components/crteffect";

export default function MyComponent() {
  return (
    <CRTEffect
      scanlines={0.2}
      glow={0.3}
      brightness={1.5}
      chromaticAberration={0.01}
    >
      <div>
        <h1>Retro Content</h1>
        <img src="/image.jpg" alt="Retro image" />
      </div>
    </CRTEffect>
  );
}
```

### LineDither

Creates animated line-based dithering effects from images, with wave animations and cursor interactions.

#### Props

| Prop                  | Type                                   | Default        | Description                                |
| --------------------- | -------------------------------------- | -------------- | ------------------------------------------ |
| `src`                 | `string`                               | -              | Image source URL                           |
| `lineSpacing`         | `number`                               | `5`            | Spacing between lines in pixels            |
| `animationSpeed`      | `number`                               | `1`            | Animation speed multiplier                 |
| `waveAmplitude`       | `number`                               | `10`           | Wave animation amplitude                   |
| `waveFrequency`       | `number`                               | `0.01`         | Wave frequency                             |
| `waveLineFrequency`   | `number`                               | `0.2`          | Frequency for line-specific waves          |
| `wavelength`          | `number`                               | `200`          | Wavelength for ripple effects              |
| `minLineWidth`        | `number`                               | `0.5`          | Minimum line width                         |
| `maxLineWidth`        | `number`                               | `4`            | Maximum line width                         |
| `useImageColors`      | `boolean`                              | `true`         | Use original image colors                  |
| `color`               | `string`                               | `"#00ffff"`    | Fallback color when not using image colors |
| `width`               | `number`                               | `800`          | Canvas width                               |
| `height`              | `number`                               | `600`          | Canvas height                              |
| `glowIntensity`       | `number`                               | `0.5`          | Glow effect intensity                      |
| `cursorWaveIntensity` | `number`                               | `0`            | Cursor interaction strength                |
| `lineDirection`       | `"horizontal" \| "vertical" \| "both"` | `"horizontal"` | Direction of lines                         |

#### Usage

```tsx
import LineDither from "@/components/linedither";

export default function MyComponent() {
  return (
    <LineDither
      src="/image.jpg"
      lineSpacing={8}
      waveAmplitude={15}
      useImageColors={true}
      lineDirection="both"
      width={1920}
      height={1080}
    />
  );
}
```

### DotDither

Generates animated dot-based dithering patterns from images with wave effects and cursor interactions.

#### Props

| Prop                  | Type      | Default     | Description                                |
| --------------------- | --------- | ----------- | ------------------------------------------ |
| `src`                 | `string`  | -           | Image source URL                           |
| `dotSpacing`          | `number`  | `8`         | Spacing between dots in pixels             |
| `animationSpeed`      | `number`  | `1`         | Animation speed multiplier                 |
| `waveAmplitude`       | `number`  | `3`         | Wave animation amplitude                   |
| `waveFrequency`       | `number`  | `0.01`      | Wave frequency                             |
| `wavelength`          | `number`  | `200`       | Wavelength for ripple effects              |
| `minDotSize`          | `number`  | `0`         | Minimum dot size                           |
| `maxDotSize`          | `number`  | `8`         | Maximum dot size                           |
| `useImageColors`      | `boolean` | `true`      | Use original image colors                  |
| `color`               | `string`  | `"#00ffff"` | Fallback color when not using image colors |
| `width`               | `number`  | `800`       | Canvas width                               |
| `height`              | `number`  | `600`       | Canvas height                              |
| `glowIntensity`       | `number`  | `0.5`       | Glow effect intensity                      |
| `cursorWaveIntensity` | `number`  | `0`         | Cursor interaction strength                |

#### Usage

```tsx
import DotDither from "@/components/dotdither";

export default function MyComponent() {
  return (
    <DotDither
      src="/image.jpg"
      dotSpacing={10}
      waveAmplitude={5}
      useImageColors={true}
      width={1920}
      height={1080}
    />
  );
}
```

### PixelBlast

Interactive pixel-based background effect with ripples, liquid effects, and mouse interactions.

#### Props

| Prop                   | Type                                              | Default     | Description                 |
| ---------------------- | ------------------------------------------------- | ----------- | --------------------------- |
| `variant`              | `"square" \| "circle" \| "triangle" \| "diamond"` | `"square"`  | Pixel shape                 |
| `pixelSize`            | `number`                                          | `3`         | Size of each pixel          |
| `color`                | `string`                                          | `"#B19EEF"` | Pixel color                 |
| `patternScale`         | `number`                                          | `2`         | Pattern scale               |
| `patternDensity`       | `number`                                          | `1`         | Pattern density             |
| `liquid`               | `boolean`                                         | `false`     | Enable liquid effect        |
| `liquidStrength`       | `number`                                          | `0.1`       | Liquid effect strength      |
| `liquidRadius`         | `number`                                          | `1`         | Liquid effect radius        |
| `pixelSizeJitter`      | `number`                                          | `0`         | Random pixel size variation |
| `enableRipples`        | `boolean`                                         | `true`      | Enable ripple effects       |
| `rippleIntensityScale` | `number`                                          | `1`         | Ripple intensity            |
| `rippleThickness`      | `number`                                          | `0.1`       | Ripple thickness            |
| `rippleSpeed`          | `number`                                          | `0.3`       | Ripple animation speed      |
| `liquidWobbleSpeed`    | `number`                                          | `4.5`       | Liquid wobble speed         |
| `speed`                | `number`                                          | `0.5`       | Overall animation speed     |
| `transparent`          | `boolean`                                         | `true`      | Transparent background      |
| `edgeFade`             | `number`                                          | `0.5`       | Edge fading effect          |
| `noiseAmount`          | `number`                                          | `0`         | Noise overlay amount        |

#### Usage

```tsx
import PixelBlast from "@/components/backgrounds/PixelBlast/PixelBlast";

export default function MyComponent() {
  return (
    <PixelBlast
      variant="circle"
      pixelSize={4}
      color="#00FF11"
      enableRipples={true}
      liquid={true}
      liquidStrength={0.2}
    />
  );
}
```

### GlowingPixels

Renders images and videos as individual glowing pixels with customizable glow effects.

#### Props

| Prop           | Type      | Default | Description               |
| -------------- | --------- | ------- | ------------------------- |
| `src`          | `string`  | -       | Image or video source URL |
| `isVideo`      | `boolean` | `false` | Whether source is a video |
| `pixelSize`    | `number`  | `4`     | Size of each pixel        |
| `pixelSpacing` | `number`  | `1`     | Spacing between pixels    |
| `width`        | `number`  | `800`   | Container width           |
| `height`       | `number`  | `600`   | Container height          |
| `glowAmount`   | `number`  | `2`     | Glow radius around pixels |
| `muted`        | `boolean` | `false` | Mute video audio          |

#### Usage

```tsx
import GlowingPixels from "@/components/glowingpixels";

export default function MyComponent() {
  return (
    <GlowingPixels
      src="/video.mp4"
      isVideo={true}
      pixelSize={6}
      pixelSpacing={2}
      glowAmount={3}
      width={1920}
      height={1080}
      muted={false}
    />
  );
}
```

### NewspaperDither

Mimics newspaper halftone printing with customizable dot patterns and authentic paper effects.

#### Props

| Prop          | Type      | Default | Description                  |
| ------------- | --------- | ------- | ---------------------------- |
| `src`         | `string`  | -       | Image or video source URL    |
| `isVideo`     | `boolean` | `false` | Whether source is a video    |
| `dotDistance` | `number`  | `6`     | Distance between dot centers |
| `minDotSize`  | `number`  | `0`     | Minimum dot radius           |
| `maxDotSize`  | `number`  | `4`     | Maximum dot radius           |
| `width`       | `number`  | `800`   | Container width              |
| `height`      | `number`  | `600`   | Container height             |
| `saturation`  | `number`  | `0.8`   | Color saturation multiplier  |
| `contrast`    | `number`  | `1.2`   | Contrast adjustment          |

#### Usage

```tsx
import NewspaperDither from "@/components/newspaperdither";

export default function MyComponent() {
  return (
    <NewspaperDither
      src="/image.jpg"
      dotDistance={8}
      minDotSize={0.5}
      maxDotSize={6}
      saturation={0.7}
      contrast={1.3}
      width={1920}
      height={1080}
    />
  );
}
```

### WordleShader

Renders video frames as grids of valid Wordle words colored by pixel luminance. Each 5x6 game board displays real dictionary words, colored gray/yellow/green via the official Wordle two-pass algorithm.

#### Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `src` | `string` | - | Video source URL |
| `isVideo` | `boolean` | `false` | Whether source is a video |
| `tileGap` | `number` | `2` | Gap between tiles in pixels |
| `gameGap` | `number` | `18` | Gap between game boards |
| `cycleInterval` | `number` | `120` | Frames between full word rebuilds |

#### Usage

```tsx
import WordleShader from "@/components/wordleshader";

export default function MyComponent() {
  return <WordleShader src="/video.mp4" isVideo />;
}
```

### PixelText

Renders images and videos as ASCII art pixels using Geist Mono font, with GPU-accelerated effects and customizable character sets.

#### Props

| Prop              | Type      | Default                         | Description                                    |
| ----------------- | --------- | ------------------------------- | ---------------------------------------------- | --------------------------------- |
| `src`             | `string`  | -                               | Image or video source URL                      |
| `isVideo`         | `boolean` | `false`                         | Whether source is a video                      |
| `pixelSize`       | `number`  | `24`                            | Size of each pixel cell                        |
| `characters`      | `string`  | `" .'`^\",:;Il!i><~+\_-?][}{1)( | \\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao\*#MW&8%B@$"` | Character set for ASCII rendering |
| `contrast`        | `number`  | `1.3`                           | Contrast adjustment                            |
| `saturation`      | `number`  | `1.0`                           | Saturation multiplier                          |
| `backgroundColor` | `string`  | `"#050505"`                     | Background color                               |

#### Usage

```tsx
import PixelText from "@/components/pixeltext";

export default function MyComponent() {
  return (
    <PixelText
      src="/video.mp4"
      isVideo={true}
      pixelSize={24}
      contrast={1.4}
      saturation={0.9}
      backgroundColor="#050505"
    />
  );
}
```

## Examples

Check individual component pages in `src/components/` for usage examples.

## Performance Notes

- Components using Three.js (LineDither, DotDither, PixelBlast) may be resource-intensive
- WordleShader loads a 12k-word dictionary on init (~111 KB); caching happens lazily per answer word
- For video content, ensure proper CORS headers are set on your video files
- NewspaperDither, GlowingPixels, and WordleShader use Canvas 2D for better performance with large content

## Browser Support

- Modern browsers with WebGL support for Three.js components
- Canvas 2D support for NewspaperDither and GlowingPixels
- Video playback requires modern browser with video codec support

## Contributing

Feel free to submit issues and enhancement requests!
