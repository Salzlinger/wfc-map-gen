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
  const [drawnPatterns, setDrawnPatterns] = useState<any[]>([]);

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
            setImageData(imageData);
          })
          .catch((error) => {
            console.error("Error loading image", error);
          });

        canvas.width = outputDimWidth * sizeFactor;
        canvas.height = outputDimHight * sizeFactor;
      }
    }
  }, [outputDimWidth, outputDimHight, sizeFactor, canvasWidth, canvasHeight]);

  const { setup, draw } = useWaveFunctionCollapse(
    outputDimWidth,
    outputDimHight,
    sizeFactor,
    patternDim
  );

  useEffect(() => {
    if (imageData) {
      setup(
        imageData.data,
        imageData.width,
        imageData.height,
        canvasWidth,
        canvasHeight
      );
    }
  }, [imageData, setup, canvasWidth, canvasHeight]);

  const drawOnCanvas = () => {
    if (context) {
      // Clear the canvas and set the background color
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);

      const drawResult = draw();
      if (drawResult) {
        const { selectedPattern, entropyMin, cellDimentionX, cellDimentionY } = drawResult;
        selectedPattern.forEach((pixel, pixelIndex) => {
          const patternSize = Math.sqrt(selectedPattern.length); // Assuming it's a square pattern
          const rowIndex = Math.floor(pixelIndex / patternSize);
          const colIndex = pixelIndex % patternSize;

          context.fillStyle = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
          const x = (entropyMin % outputDimWidth) * cellDimentionX + colIndex * cellDimentionX;
          const y = Math.floor(entropyMin / outputDimWidth) * cellDimentionY + rowIndex * cellDimentionY;

          context.fillRect(x, y, cellDimentionX, cellDimentionY);
        });

        setDrawnPatterns([...drawnPatterns, drawResult]);
      }
    }
  };

  return (
    <>
      <canvas ref={canvasRef} />
      <button onClick={drawOnCanvas}>Draw!</button>
    </>
  );
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
};

export default CanvasComponent;
