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
  outputDimWidth = 50,
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

        loadImage("/images/flowers.bmp")
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
          })
          .catch((error) => {
            console.error("Error loading image", error);
          });

        canvas.width = outputDimWidth * sizeFactor;
        canvas.height = outputDimHight * sizeFactor;
      }
    }
  }, [outputDimWidth, outputDimHight, sizeFactor]);

  const initSetup = () => {
    imageData &&
      setup(
        imageData.data,
        imageData.width,
        imageData.height,
        canvasWidth,
        canvasHeight
      );
  };

  const drawOnCanvas = () => {
    console.log("fired");
    if (context) {
      console.log("insdide Context");

      // Clear the canvas and set the background color
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);

      try {
        console.log("inside draw");
        const drawResult = draw();
        console.log(drawResult, "draw resutl");
        if (drawResult) {
          const {
            selectedPattern,
            entropyMin,
            cellDimentionX,
            cellDimentionY,
          } = drawResult;
          //Use these variables here
          console.log(selectedPattern, "selectedPattern");

          // Rendering based on the algorithm's output
          // Example: Fill a rectangle based on the selected pattern
          if (selectedPattern && cellDimentionX && cellDimentionY) {
            const patternSize = Math.sqrt(selectedPattern.length); // Assuming it's a square pattern (e.g., 3x3)
            selectedPattern.forEach((pixel, pixelIndex) => {
              // Calculate row and column indices
              const rowIndex = Math.floor(pixelIndex / patternSize);
              const colIndex = pixelIndex % patternSize;

              // Set the fill style to the RGBA color of the pixel
              context.fillStyle = `rgba(${pixel[0]}, ${pixel[1]}, ${
                pixel[2]
              }, ${pixel[3] / 255})`;

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
          }
        }
      } catch (error) {
        console.error(error);
      }

      // Note: No need to call ctx.stroke() if no outline is desired (equivalent to noStroke() in Processing)
    }
  };

  // Call the draw function periodically
  //   useEffect(() => {
  //     const timer = setInterval(() => {
  //       drawOnCanvas();
  //     }, 1000 / frameRate); // Adjust interval based on desired frame rate

  //     return () => clearInterval(timer);
  //   }, [context, frameRate]);

  return (
    <>
      <canvas ref={canvasRef} />
      <button onClick={drawOnCanvas}>draw!</button>
      <button onClick={initSetup}>setup!</button>
    </>
  );
};

export default CanvasComponent;
