"use client";
import React, { useRef, useEffect, useState } from "react";
import useWaveFunctionCollapse from "../index";
import { error } from "console";

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
}: CanvasComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [imageData, setImageData] = useState<ImageData>();
  const [drawnPatterns, setDrawnPatterns] = useState<any[]>([]);

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

        loadImage("/images/flowers.bmp")
          .then((image) => {
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(
              0,
              0,
              image.width,
              image.height
            );
            console.log(imageData, "imageData");
            setImageData(imageData);
          })
          .catch((error) => {
            console.error("Error loading image", error);
          });

        canvas.width = outputDimWidth * sizeFactor;
        canvas.height = outputDimHight * sizeFactor;

        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      }
    }
  }, [outputDimWidth, outputDimHight, sizeFactor]);

  useEffect(() => {
    if (imageData) {
      setup(
        imageData.data,
        imageData.width,
        imageData.height,
        outputDimWidth * sizeFactor,
        outputDimHight * sizeFactor
      );
    }
  }, [imageData, outputDimWidth, outputDimHight, sizeFactor]);

  const drawOnCanvas = async () => {
    if (context) {
      // Clear the canvas and set the background color
      const drawResult = await draw();
      if (drawResult) {
        const { selectedPattern, entropyMin, cellDimentionX, cellDimentionY } =
          drawResult;
        //Use these variables here

        // Rendering based on the algorithm's output
        // Example: Fill a rectangle based on the selected pattern
        if (selectedPattern && cellDimentionX && cellDimentionY) {
          const patternSize = Math.sqrt(selectedPattern.length); // Assuming it's a square pattern (e.g., 3x3)
          selectedPattern.forEach((pixel, pixelIndex) => {
            // Calculate row and column indices
            const rowIndex = Math.floor(pixelIndex / patternSize);
            const colIndex = pixelIndex % patternSize;

            // Set the fill style to the RGBA color of the pixel
            context.fillStyle = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${
              pixel[3] / 255
            })`;

            // Calculate the position of the pixel on the canvas
            const x =
              (entropyMin % outputDimWidth) * cellDimentionX +
              colIndex * cellDimentionX;
            const y =
              Math.floor(entropyMin / outputDimWidth) * cellDimentionY +
              rowIndex * cellDimentionY;

            // Draw the pixel as a small rectangle
            context.fillRect(x, y, cellDimentionX, cellDimentionY);
          });
          setDrawnPatterns([...drawnPatterns, drawResult]);
        }
        if (selectedPattern === null || !entropyMin || entropyMin === 0) {
          return false;
        } else {
          return true;
        }
      }
      // Note: No need to call ctx.stroke() if no outline is desired (equivalent to noStroke() in Processing)
    }
  };

  const drawLoop = async () => {
    let loop = true;
    while (loop) {
      const result = await drawOnCanvas();
      console.log(result);
      if (!result) {
        loop = false;
      }
    }
  };

  return (
    <>
      <canvas ref={canvasRef} />
      <button onClick={drawLoop}>draw </button>
      <button onClick={drawOnCanvas}>draw step</button>
    </>
  );
};

export default CanvasComponent;
