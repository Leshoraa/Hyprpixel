# Hyprpixel

Hyprpixel is a high-performance React web application that transforms live camera feeds and static images into dynamic, customizable pixel art. Built with a focus on visual aesthetics and consistency across devices, the application uses advanced image processing techniques to deliver real-time pixelation effects, advanced dithering, and custom shape rendering.

## Core Features

- **Real-Time Pixelation Engine**: Responsive image transformation algorithms operating directly on HTML5 Canvas for both live camera feeds and uploaded images.
- **Dynamic Pixel Scaling**: Device-aware scaling logic ensuring consistent pixel density and visual aesthetic across desktop and mobile environments.
- **Advanced Processing Capabilities**:
  - Bayer Dithering algorithms for optimized color reduction and shading.
  - Custom pixel shape mapping (Square, Circle, Diamond).
  - Precise color matching from source images to applied palettes.
- **Extensive Color Theming**: Support for over 24 customizable pastel color schemes and palettes.
- **Modular Interface Architecture**: A structured 5-tab control panel layout (including Pixel and Light configurations) designed for deep parameter tuning without UI clutter.
- **Hardware Integration**: Built-in functionality for responsive touch interactions, camera mirroring, and flash toggling.

## Technical Stack

- **Framework**: React, Vite
- **Processing**: HTML5 Canvas API, JavaScript MediaStreams
- **Deployment**: Vercel configuration included

## Installation

### Prerequisites

- Node.js (v18.0 or newer)
- npm package manager

### Setup Instructions

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd hyprpixel
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Architecture Summary

Hyprpixel utilizes a modular component architecture prioritizing render performance. The intensive canvas manipulations are handled by dedicated processing layers, separating heavy computation from the React rendering cycle. The user interface implements responsive layouts with custom interaction hooks to guarantee fluid operations on touch-enabled devices and standard pointer interfaces.
