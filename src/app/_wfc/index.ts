import { useState } from "react";
import { Adjacencies, Entropy, Frequencies, Patterns, Wave } from "./types";

const useWaveFunctionCollapse = (
  outputDimWidth: number,
  outputDimHight: number,
  sizeFactor: number,
  patternDim: number
) => {
  // GLOABL VARIABLES

  // refactor as input variables but give default values
  // const outputDimWidth = 96
  // const outputDimHight = 50
  // const sizeFactor = 9
  // const patternDim = 3 // N

  /**
    * The variable W probably stands for "Wave" in the context 
    of the WFC algorithm. This is a central concept in WFC, where 
    the "wave" represents the state of the entire grid. Initially,
    each cell in the grid can collapse into any possible state 
    (or tile), and W would track these possibilities for each cell.
    */
  const [wave, setWave] = useState<Wave>(new Map());

  const updateWave = (index: number, wavePatterns: Set<number>) => {
    const newWave = new Map(wave);
    newWave.set(index, wavePatterns);

    setWave(newWave);
  };

  const updateWaveForCell = (cellIndex: number, newPatternId: number) => {
    const newWave = new Map(wave);
    newWave.set(cellIndex, new Set([newPatternId]));

    setWave(newWave);
  };

  /**
    * A is likely used to store adjacency rules. In WFC, 
    it's essential to know which tiles can be placed next to 
    each other. A could be a structure that holds this information, 
    mapping each tile to other tiles that can be adjacent to it.
    */
  const [adjacencies, setAdjacencies] = useState<Adjacencies>([]);

  const updateAdjacencies = (index: number, adjacencySets: Set<number>[]) => {
    const newAdjacencyMap = new Map<number, Set<number>[]>().set(
      index,
      adjacencySets
    );
    const newAdjacencies = [...adjacencies];
    newAdjacencies[index] = newAdjacencyMap;

    setAdjacencies(newAdjacencies);
  };

  /**
    * H typically represents entropy in the WFC algorithm. Entropy, 
    in this context, is a measure of uncertainty or the number of 
    possible states a cell can collapse into. Cells with lower 
    entropy (fewer possible states) are often prioritized for 
    collapsing.
    */
  const [entropy, setEntropy] = useState<Entropy>(new Map());

  const updateEntropyForCell = (cellIndex: number, newEntropyValue: number) => {
    const newEntropy = new Map(entropy);
    newEntropy.set(cellIndex, newEntropyValue);

    setEntropy(newEntropy);
  };

  /**
    * patterns would be the collection of unique tiles or states 
    that cells in the grid can collapse into. These are usually 
    derived from the input sample in WFC.
    */
  const [patterns, setPatterns] = useState<Patterns>([]);
  /**
    * freqs likely stands for frequencies. This could be related 
    to the frequency of occurrence of each pattern in the input 
    sample. In WFC, patterns that occur more frequently in the 
    sample might be given a higher likelihood of being chosen 
    during the collapse process.
    */
  const [frequencies, setFrequencies] = useState<Frequencies>([]);

  /**
    * These variables are probably used to store dimensions or 
    scaling factors. In a graphical context, they might represent 
    the size of each cell in the grid on the screen. For example, 
    if you're rendering the grid to a canvas, xs and ys might be 
    the pixel dimensions of each cell.
    */
  const [cellDimentionX, setCellDimentionX] = useState<number>();
  const [cellDimentionY, setCellDimentionY] = useState<number>();

  /**
    * This variable likely stores the possible directions for 
    adjacency. In a grid, this usually includes directions like up, 
    down, left, and right. It's used to determine neighboring cells 
    relative to a given cell.
    */
  const directions: [number, number][] = [
    [-1, 0], // Left
    [1, 0], // Right
    [0, -1], // Up
    [0, 1], // Down
  ];

  const directionMapping: { [key: string]: number } = {
    "[-1, 0]": 0, // Left
    "[1, 0]": 1, // Right
    "[0, -1]": 2, // Up
    "[0, 1]": 3, // Down
  };

  const setup = (
    imageData: Uint8ClampedArray,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // need to be imported from component
    // let image // input image

    // let imageWidth // width of input image
    // let imageHeight // height of input image

    // let canvasWidth
    // let canvasHeight

    /**
     * dimensions of cells (rect) in output
     */
    setCellDimentionX(Math.floor(canvasWidth / outputDimWidth));
    setCellDimentionY(Math.floor(canvasHeight / outputDimHight));

    let kernel: number[][] = [];

    for (let n = 0; n < patternDim; n++) {
      let row: number[] = [];
      for (let i = 0; i < patternDim; i++) {
        row.push(i + n * imageWidth);
      }
      kernel.push(row);
    }

    /**
     * Stores the different patterns found in input
     */

    // array list to store all the patterns found in input
    let allPatterns: number[][][][] = [];

    const rotate90 = (matrix: number[][][]): number[][][] => {
        const rotatedMatrix = [];
        for (let x = 0; x < matrix[0].length; x++) {
          const row = [];
          for (let y = matrix.length - 1; y >= 0; y--) {
            row.push(matrix[y][x]);
          }
          rotatedMatrix.push(row);
        }
        return rotatedMatrix;
      };
      

    // Looping over each pixel in the image
    for (let y = 0; y < imageHeight; y++) {
      for (let x = 0; x < imageWidth; x++) {
        // Create the NxN pattern (cmat) for each position
        for (let y = 0; y < imageHeight; y++) {
            for (let x = 0; x < imageWidth; x++) {
              let cmat: number[][][] = []; // Array to store color data for this pattern
              kernel.forEach(row => {
                let patternRow = row.map(offset => {
                  let pixelX = (x + offset) % imageWidth;
                  let pixelY = Math.floor((offset + imageWidth * y) / imageWidth) % imageHeight;
                  let pixelIndex = (pixelY * imageWidth + pixelX) * 4;
                  return [imageData[pixelIndex], imageData[pixelIndex + 1], imageData[pixelIndex + 2], imageData[pixelIndex + 3]];
                });
                cmat.push(patternRow);
              });

        for (let r = 0; r < 4; r++) {
          cmat = rotate90(cmat); // Rotate 90 degrees
          allPatterns.push(cmat);
          allPatterns.push(cmat.slice().reverse()); // Vertical flip
          allPatterns.push(cmat.map((row) => row.slice().reverse())); // Horizontal flip
        }
      }
    }

    /**
        * Stores the different patterns found in input 
        Once every pattern has been stored,
            - we flatten them (convert to 1D) for convenience
            - count the number of occurences for each one of them 
                (one pattern can be found multiple times in input)
            - select and store unique patterns only
        */

    // Assuming 'all' is an array of 2D arrays (e.g., number[][][])
    // Flatten each 2D pattern into 1D
    let flattenedAll = allPatterns.map((pattern) =>
      pattern.flatMap((row) => row)
    );

    // Create a map to count occurrences
    let patternCounts = new Map<string, number>();

    flattenedAll.forEach((pattern) => {
      // Convert the pattern array to a string to use as a Map key
      let key = JSON.stringify(pattern);

      if (patternCounts.has(key)) {
        const newPatterKey = patternCounts.get(key);
        if (newPatterKey) {
          patternCounts.set(key, newPatterKey + 1);
        }
      } else {
        patternCounts.set(key, 1);
      }
    });

    // Get the number of unique patterns
    let numberOfUniquePatterns = patternCounts.size;

    // Extracting patterns and frequencies
    let newPatterns = Array.from(patternCounts.keys()).map((key) =>
      JSON.parse(key)
    );
    setPatterns(newPatterns);
    let newFrequencies = Array.from(patternCounts.values());
    setFrequencies(newFrequencies);

    /**
     * Initializes the 'wave', entropy and adjacencies array lists
     */

    /**
        Array wave (the Wave) keeps track of all the available patterns, 
        for each cell. At start start, all patterns are valid anywhere 
        in the Wave so each subarray is a list of indices of all 
        the patterns
        */

    // Populate W with each cell having a set of all possible patterns
    for (let i = 0; i < outputDimWidth * outputDimHight; i++) {
      updateWave(
        i,
        new Set(
          Array.from({ length: numberOfUniquePatterns }, (_, index) => index)
        )
      );
    }

    /**
        Array H should normally be populated with entropy values.
            Entropy is just a fancy way to represent the number of patterns 
            still available in a cell. We can skip this computation and 
            populate the array with the number of available patterns instead.
            
            At start all patterns are valid anywhere in the Wave, so all 
            cells share the same value (numberOfUniquePatterns). We must 
            however pick one cell at random and assign a lower value to it. 
            Why ? Because the algorithm in draw() needs to find a cell with 
            the minimum non-zero entropy value.
        */

    // Populate entropy with numberOfUniquePatterns for each cell
    // call in useEffect
    const newEntropy = new Map<number, number>();
    const initializeEntropy = () => {
      // call in useEffect
      const newEntropy = new Map<number, number>();

      // Set initial entropy values
      for (let i = 0; i < outputDimWidth * outputDimHight; i++) {
        newEntropy.set(i, numberOfUniquePatterns);
      }

      // Randomly choose one cell to have lower entropy
      const randomCellIndex = Math.floor(
        Math.random() * outputDimWidth * outputDimHight
      );
      newEntropy.set(randomCellIndex, numberOfUniquePatterns - 1);

      // Update the state
      setEntropy(newEntropy);
    };
    initializeEntropy();

    // Set initial entropy values
    for (let i = 0; i < outputDimWidth * outputDimHight; i++) {
      newEntropy.set(i, numberOfUniquePatterns);
    }

    // Randomly choose one cell to have lower entropy
    const randomCellIndex = Math.floor(
      Math.random() * outputDimWidth * outputDimHight
    );
    newEntropy.set(randomCellIndex, numberOfUniquePatterns - 1);

    // Update the state
    setEntropy(newEntropy);

    //
    // for (let i = 0; i < outputDimWidth * outputDimHight; i++) {
    //     entropy.set(i, numberOfUniquePatterns);
    // }

    // // Randomly choose one cell to have lower entropy (numberOfUniquePatterns - 1)
    // const randomCellIndex = Math.floor(Math.random() * outputDimWidth * outputDimHight);
    // entropy.set(randomCellIndex, numberOfUniquePatterns - 1);
    //
    /**
        Array A (for Adjacencies) is an index datastructure that describes 
        the ways that the patterns can be placed near one another. 
        More explanations below
        */

    for (let i = 0; i < numberOfUniquePatterns; i++) {
      let adjacencySets: Set<number>[] = directions.map(
        () => new Set<number>()
      );
      updateAdjacencies(i, adjacencySets);
    }

    // Computation of patterns compatibilities (check if some patterns are adjacent, if so -> store them based on their location)

    /**
        EXAMPLE:
            If pattern index 42 can placed to the right of pattern index 120,
            we will store this adjacency rule as follow:
        
                            adjacencies[120][1].add(42)
        
            Here '1' stands for 'right' or 'East'/'E'
        
            0 = left or West/W
            1 = right or East/E
            2 = up or North/N
            3 = down or South/S
        */

    for (let i = 0; i < numberOfUniquePatterns; i++) {
      for (let j = 0; j < numberOfUniquePatterns; j++) {
        // Check horizontal adjacency (Left and Right)
        if (
          patterns[i]
            .slice(0, -patternDim)
            .every((val, index) => val === patterns[j].slice(patternDim)[index])
        ) {
          // Access the map for pattern i and pattern j
          const adjacencyMapI = adjacencies[i];
          const adjacencyMapJ = adjacencies[j];

          // Get the adjacency sets for pattern i and j, and update them
          adjacencyMapI?.get(i)?.[0].add(j); // i2 can be to the left of i1
          adjacencyMapJ?.get(j)?.[1].add(i); // i1 can be to the right of i2
        }

        // Check vertical adjacency (Top and Bottom)
        let isTopBottomAdjacent = true;
        for (let row = 0; row < patternDim - 1; row++) {
          if (
            !patterns[i]
              .slice(row * patternDim, (row + 1) * patternDim)
              .every(
                (val, index) =>
                  val ===
                  patterns[j].slice(
                    (row + 1) * patternDim,
                    (row + 2) * patternDim
                  )[index]
              )
          ) {
            isTopBottomAdjacent = false;
            break;
          }
        }
        if (isTopBottomAdjacent) {
          const adjacencyMapI = adjacencies[i];
          const adjacencyMapJ = adjacencies[j];

          adjacencyMapI?.get(i)?.[2].add(j); // i2 can be above i1
          adjacencyMapJ?.get(j)?.[3].add(i); // i1 can be below i2
        }
      }
    }
  };

  // DRAW FUNCTIONS

  const findMinEntropyKey = (entropyMap: Map<number, number>) => {
    let minKey = null;
    let minValue = Infinity;

    entropyMap.forEach((value, key) => {
      if (value < minValue) {
        minValue = value;
        minKey = key;
      }
    });

    return minKey;
  };

  const selectRandomPattern = (
    wave: Wave,
    entropyMin: number | null,
    frequencies: Frequencies
  ): number | null => {
    if (entropyMin) {
      const possiblePatterns = wave.get(entropyMin);

      if (!possiblePatterns || possiblePatterns.size === 0) {
        return null;
      }

      // Create an array with each pattern ID repeated according to its frequency
      const weightedPatterns: number[] = [];
      possiblePatterns.forEach((idP) => {
        const freq = frequencies[idP];
        for (let i = 0; i < freq; i++) {
          weightedPatterns.push(idP);
        }
      });

      // Randomly select an index from the weightedPatterns array
      const randomIndex = Math.floor(Math.random() * weightedPatterns.length);
      return weightedPatterns[randomIndex];
    }
    return null;
  };

  const isSubSetOf = (subset: Set<number>, superset: Set<number>): boolean => {
    return Array.from(subset).every((elem) => superset.has(elem));
  };

  const intersectSets = (setA: Set<number>, setB: Set<number>): Set<number> => {
    const intersection = new Set<number>();
    setA.forEach((elem) => {
      if (setB.has(elem)) {
        intersection.add(elem);
      }
    });
    return intersection;
  };

  const draw = () => {
    if (!entropy || entropy.size === 0) {
      return null;
    }
    /**
     * Find cell with minimum non-zero entropy (not collapsed yet).
     */
    const entropyMin: number | null = findMinEntropyKey(entropy);
    if (entropyMin === null) {
      return null; // Return null if entropyMin is not found
    }

    /**
        Among the patterns available in the selected cell (the one with 
        min entropy), select one pattern randomly, weighted by the 
        frequency that pattern appears in the input image.
        */

    const selectedPatternId = selectRandomPattern(
      wave,
      entropyMin,
      frequencies
    );
    if (selectedPatternId === null) {
      return null; // Return null if no pattern is selected
    }

    /**
        The Wave's subarray corresponding to the cell with min entropy 
        should now only contains the id of the selected pattern
        */

    updateWaveForCell(entropyMin, selectedPatternId);
    /**
        Its key can be deleted in the dict of entropies
        */
    entropy.delete(entropyMin);
    /**
        PROPAGATION
        */

    /**
        * Once a cell is collapsed, its index is put in a stack. 
        That stack is meant later to temporarily store indices 
        of neighoring cells
        */

    let stack: number[] = [entropyMin];

    while (stack.length > 0) {
      /**
            First thing we do is pop() the last index contained in 
            the stack (the only one for now) and get the indices 
            of its 4 neighboring cells (E, W, N, S). 
            We have to keep them withing bounds and make sure 
            they wrap around.
            */
      const currentElementIndex = stack.pop(); // Get the top element of the stack
      if (currentElementIndex !== undefined) {
        for (const [dx, dy] of directions) {
          const x =
            ((currentElementIndex % outputDimWidth) + dx + outputDimWidth) %
            outputDimWidth;
          const y = Math.floor(currentElementIndex / outputDimWidth) + dy;
          if (y >= 0 && y < outputDimHight) {
            const neighborElementIndex = x + y * outputDimWidth;

            /**
                        We make sure the neighboring cell is not collapsed yet 
                        (we don't want to update a cell that has only 1 
                        pattern available)
                        */
            if (entropy.has(neighborElementIndex)) {
              /**
                            Then we check all the patterns that COULD be placed at 
                            that location. EX: if the neighboring cell is on the left 
                            of the current cell (east side), we look at all the 
                            patterns that can be placed on the left of each pattern 
                            contained in the current cell.
                            */
              let possiblePatterns = new Set<number>();
              const currentCellPatterns = wave.get(currentElementIndex);
              if (currentCellPatterns) {
                const dir = directionMapping[JSON.stringify([dx, dy])];

                currentCellPatterns.forEach((idP) => {
                  const adjacencyMaps = adjacencies[idP];
                  if (adjacencyMaps) {
                    const adjacencySet = adjacencyMaps.get(idP);
                    if (adjacencySet) {
                      const possiblePatternsInDirection = adjacencySet[dir];
                      possiblePatternsInDirection.forEach((pattern) =>
                        possiblePatterns.add(pattern)
                      );
                    }
                  }
                });
              }

              /**
                            We also look at the patterns that ARE available in the neighboring cell
                            */
              const availablePatterns: Set<number> = new Set(
                wave.get(neighborElementIndex) ?? []
              );

              /**
                            Now we make sure that the neighboring cell really need to be updated. 
                            If all its available patterns are already in the list of all the possible patterns:
                            —> there’s no need to update it (the algorithm skip this neighbor and goes on to the next)
                            */
              if (!isSubSetOf(availablePatterns, possiblePatterns)) {
                /**
                                If it is not a subset of the possible list:
                                —> we look at the intersection of the two sets (all the patterns that can be placed 
                                at that location and that, "luckily", are available at that same location)
                                */
                const intersectedPatterns = intersectSets(
                  possiblePatterns,
                  availablePatterns
                );

                /**
                                If they don't intersect (patterns that could have been placed there but are not available) 
                                it means we ran into a "contradiction". We have to stop the whole WFC algorithm.
                                */
                if (intersectedPatterns.size === 0) {
                  console.log("contradiction");
                  // Handle the contradiction case here
                  // This might involve setting a state, calling a callback, or other actions
                  // For example, you might set a state indicating the algorithm should stop
                  // setContradictionFound(true);
                  return; // Exit the function early if needed
                }

                /**
                                If, on the contrary, they do intersect -> we update the neighboring cell with that refined 
                                list of pattern's indices
                                */
                updateWave(neighborElementIndex, intersectedPatterns);

                /**
                                Because that neighboring cell has been updated, its number of valid patterns has decreased
                                and its entropy must be updated accordingly.
                                Note that we're subtracting a small random value to mix things up: sometimes cells we'll
                                end-up with the same minimum entropy value and this prevent to always select the first one of them.
                                It's a cosmetic trick to break the monotony of the animation
                                    */
                const currentPatterns = wave.get(neighborElementIndex);
                if (currentPatterns) {
                  const updatedEntropyValue =
                    currentPatterns.size - Math.random() * 0.1;
                  updateEntropyForCell(
                    neighborElementIndex,
                    updatedEntropyValue
                  );
                }

                /**
                                Finally, and most importantly, we add the index of that neighboring cell to the stack 
                                so it becomes the next current cell in turns (the one whose neighbors will be updated 
                                during the next while loop)
                                */
                stack.push(neighborElementIndex);
              }
            }
          }
        }
      }
    }

    const selectedPattern = patterns[selectedPatternId]
      ? patterns[selectedPatternId][0]
      : null;

    return {
      selectedPattern: selectedPattern,
      entropyMin: entropyMin,
      cellDimentionX: cellDimentionX,
      cellDimentionY: cellDimentionY,
    };
  };
  return { setup, draw };
};

export default useWaveFunctionCollapse;
