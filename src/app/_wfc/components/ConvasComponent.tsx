"use client";
import React, { useRef, useEffect, useState } from "react";
import useWaveFunctionCollapse from "../index";

interface CanvasComponentProps {
  outputDimWidth?: number;
  outputDimHight?: number;
  sizeFactor?: number;
  patternDim?: number;
  frameRate?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
};

const CanvasComponent = ({
  outputDimWidth = 96,
  outputDimHight = 50,
  sizeFactor = 9,
  patternDim = 3,
  frameRate = 1,
  canvasWidth = 100,
  canvasHeight = 100,
}: CanvasComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [imageData, setImageData] = useState<ImageData>();
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const { setup, draw } = useWaveFunctionCollapse(
    outputDimWidth,
    outputDimHight,
    sizeFactor,
    patternDim
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        setContext(context);

        loadImage("/images/circuit.png")
          .then((image) => {
            setImageWidth(image.width);
            setImageHeight(image.height);
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(
              0,
              0,
              image.width,
              image.height
            );
            console.log(imageData, "imageData");
            setImageData(imageData);
            setup(
              imageData.data,
              imageData.width,
              imageData.height,
              canvasWidth,
              canvasHeight
            );
          })
          .catch((error) => {
            console.error("Error loading image", error);
          });

        canvas.width = outputDimWidth * sizeFactor;
        canvas.height = outputDimHight * sizeFactor;
      }
    }
  }, [outputDimWidth, outputDimHight, sizeFactor]);

  const drawOnCanvas = () => {
    if (context) {
      // Clear the canvas and set the background color
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);

      const drawResult = draw();
      if (drawResult) {
        const { selectedPattern, entropyMin, cellDimentionX, cellDimentionY } =
          drawResult;
        //   Use these variables here

        //   Rendering based on the algorithm's output
        //   Example: Fill a rectangle based on the selected pattern
        if (selectedPattern) {
          context.fillStyle = selectedPattern.fillColor; // replace with actual color
          const x = (entropyMin % outputDimWidth) * cellDimentionX;
          const y = Math.floor(entropyMin / outputDimWidth) * cellDimentionY;
          context.fillRect(x, y, cellDimentionX, cellDimentionY);
        }
      }

      // Note: No need to call ctx.stroke() if no outline is desired (equivalent to noStroke() in Processing)
    }
  };

  // Call the draw function periodically
  useEffect(() => {
    const timer = setInterval(() => {
      drawOnCanvas();
    }, 1000 / frameRate); // Adjust interval based on desired frame rate

    return () => clearInterval(timer);
  }, [context, frameRate]);

  return <canvas ref={canvasRef} />;
};

export default CanvasComponent;
