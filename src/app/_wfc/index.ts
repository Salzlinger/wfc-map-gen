import { useState } from "react"
import { Adjacencies, Entropy, Frequencies, Patterns, Wave } from "./types"

const useWaveFunctionCollapse = () => {

    // refactor as input variables but give default values
    const outputDimWidth = 96
    const outputDimHight = 50
    const sizeFactor = 9
    const PatterDim = 3 // N

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

        /**
    * A is likely used to store adjacency rules. In WFC, 
    it's essential to know which tiles can be placed next to 
    each other. A could be a structure that holds this information, 
    mapping each tile to other tiles that can be adjacent to it.
    */
    const [adjacencies, setAdjacencies] = useState<Adjacencies>([]);

    const updateAdjacencies = (index: number, adjacencySets: Set<number>[]) => {
        const newAdjacencyMap = new Map<number, Set<number>[]>().set(index, adjacencySets);
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
    const [entropy, setEntropy] = useState<Entropy>(new Map())

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
    const [cellDimentionX, setCellDimentionX] = useState<number>()
    const [cellDimentionY, setCellDimentionY] = useState<number>()


    const setup = () => {
        /**
        In summary, the size() function in Processing sets the
        dimensions of the rendering window. In a web application,
        you would use a combination of HTML, CSS, and
        JavaScript/TypeScript to achieve similar functionality, 
        likely through the use of an HTML canvas element.
        */
        // size(w*f, h*f, P2D)

        /**
        sets background color of the canvas
        */
        // background('#FFFFFF')

        /**
        render refresh rate of the canvas
        */
        // frameRate(1000)

        /**
        noStroke() is a function that disables drawing the outline 
        (stroke) around shapes. In Processing, shapes are drawn with 
        an outline by default. Calling this function means that 
        subsequent shapes drawn will not have an outline unless the 
        stroke is set again with stroke().
        */
        // noStroke()

        // need to be imported from component
        let image // input image

        let imageWidth // width of input image
        let imageHeight // height of input image

        let canvasWidth
        let canvasHeight

        /**
        * dimensions of cells (rect) in output
        */
        setCellDimentionX(Math.floor(canvasWidth / outputDimWidth));
        setCellDimentionY(Math.floor(canvasHeight / outputDimHight));


        let kernel: number[][] = [];

        for (let n = 0; n < PatterDim; n++) {
            let row: number[] = [];
            for (let i = 0; i < PatterDim; i++) {
                row.push(i + n * imageWidth);
            }
            kernel.push(row);
        }

        /**
        * This variable likely stores the possible directions for 
        adjacency. In a grid, this usually includes directions like up, 
        down, left, and right. It's used to determine neighboring cells 
        relative to a given cell.
        */
        const directions: [number, number][] = [
            [-1, 0],  // Left
            [1, 0],   // Right
            [0, -1],  // Up
            [0, 1]    // Down
        ];
        
        /**
        * Stores the different patterns found in input 
        */

        // array list to store all the patterns found in input
        let allPatterns: number[][][] = [];

        let imageData: number[] // Your image data

        const rotate90 = (matrix: number[][]): number[][] => {
            return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
        }

        // Looping over each pixel in the image
        for (let y = 0; y < imageHeight; y++) {
            for (let x = 0; x < imageWidth; x++) {
                // Create the NxN pattern (cmat) for each position
                let cmat: number[][] = kernel.map(row => 
                    row.map(offset => imageData[((x + offset) % imageWidth) + (((offset + imageWidth * y) / imageWidth) % imageHeight) * imageWidth])
                );
                
                for (let r = 0; r < 4; r++) {
                    cmat = rotate90(cmat); // Rotate 90 degrees
                    allPatterns.push(cmat);
                    allPatterns.push(cmat.slice().reverse()); // Vertical flip
                    allPatterns.push(cmat.map(row => row.slice().reverse())); // Horizontal flip
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
        let flattenedAll = allPatterns.map(pattern => pattern.flatMap(row => row));
    
        // Create a map to count occurrences
        let patternCounts = new Map<string, number>();

        flattenedAll.forEach(pattern => {
            // Convert the pattern array to a string to use as a Map key
            let key = JSON.stringify(pattern);
            
            if (patternCounts.has(key)) {
                patternCounts.set(key, patternCounts.get(key)? + 1);
            } else {
                patternCounts.set(key, 1);
            }
        });

        // Get the number of unique patterns
        let numberOfUniquePatterns = patternCounts.size;

        // Extracting patterns and frequencies
        let newPatterns = Array.from(patternCounts.keys()).map(key => JSON.parse(key));
        setPatterns(newPatterns)
        let newFrequencies = Array.from(patternCounts.values());
        setFrequencies(newFrequencies)


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
            updateWave(i, new Set(Array.from({ length: numberOfUniquePatterns }, (_, index) => index)));
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
        const initializeEntropy = () => {
            // call in useEffect
            const newEntropy = new Map<number, number>();
        
            // Set initial entropy values
            for (let i = 0; i < outputDimWidth * outputDimHight; i++) {
                newEntropy.set(i, numberOfUniquePatterns);
            }
        
            // Randomly choose one cell to have lower entropy
            const randomCellIndex = Math.floor(Math.random() * outputDimWidth * outputDimHeight);
            newEntropy.set(randomCellIndex, numberOfUniquePatterns - 1);
        
            // Update the state
            setEntropy(newEntropy);
        };
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
            let adjacencySets: Set<number>[] = directions.map(() => new Set<number>());
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
                    if (patterns[i].slice(0, -PatterDim).every((val, index) => val === patterns[j].slice(PatterDim)[index])) {
                        // Access the map for pattern i and pattern j
                        const adjacencyMapI = adjacencies[i];
                        const adjacencyMapJ = adjacencies[j];
                    
                        // Get the adjacency sets for pattern i and j, and update them
                        adjacencyMapI?.get(i)?.[0].add(j); // i2 can be to the left of i1
                        adjacencyMapJ?.get(j)?.[1].add(i); // i1 can be to the right of i2
                    }
                    
            
                    // Check vertical adjacency (Top and Bottom)
                    let isTopBottomAdjacent = true;
                    for (let row = 0; row < PatterDim - 1; row++) {
                        if (!patterns[i].slice(row * PatterDim, (row + 1) * PatterDim).every((val, index) => val === patterns[j].slice((row + 1) * PatterDim, (row + 2) * PatterDim)[index])) {
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
            
        
    }

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

    const selectRandomPattern = (wave: Wave, entropyMin: number | null, frequencies: Frequencies): number | null => {
        if (entropyMin) {
            const possiblePatterns = wave.get(entropyMin);
        
    
            if (!possiblePatterns || possiblePatterns.size === 0) {
                return null;
            }

        
            // Create an array with each pattern ID repeated according to its frequency
            const weightedPatterns: number[] = [];
            possiblePatterns.forEach(idP => {
                const freq = frequencies[idP];
                for (let i = 0; i < freq; i++) {
                    weightedPatterns.push(idP);
                }
            });
        
            // Randomly select an index from the weightedPatterns array
            const randomIndex = Math.floor(Math.random() * weightedPatterns.length);
            return weightedPatterns[randomIndex];
        }
        return null
    };

    const updateWaveForCell = (cellIndex: number, newPatternId: number) => {
        const newWave = new Map(wave);
        newWave.set(cellIndex, new Set([newPatternId]));
    
        setWave(newWave);
    };
    

    const draw = () => {
        if (!entropy || entropy.size === 0) {
            return null
        } 

    }
    /**
     * Find cell with minimum non-zero entropy (not collapsed yet).
     */
    const entropyMin: number | null = findMinEntropyKey(entropy);

    /**
    Among the patterns available in the selected cell (the one with 
    min entropy), select one pattern randomly, weighted by the 
    frequency that pattern appears in the input image.
    */
    
    const selectedPatternId = selectRandomPattern(wave, entropyMin, frequencies);

    /**
    The Wave's subarray corresponding to the cell with min entropy 
    should now only contains the id of the selected pattern
    */

    if (entropyMin && selectedPatternId) {
        updateWaveForCell(entropyMin, selectedPatternId)
        /**
        Its key can be deleted in the dict of entropies
        */
        entropy.delete(entropyMin)
        /**
        PROPAGATION
        */
        
        /**
        * Once a cell is collapsed, its index is put in a stack. 
        That stack is meant later to temporarily store indices 
        of neighoring cells
        */

        let stack: number[] = [entropyMin];

        while(stack) {

            /**
            First thing we do is pop() the last index contained in 
            the stack (the only one for now) and get the indices 
            of its 4 neighboring cells (E, W, N, S). 
            We have to keep them withing bounds and make sure 
            they wrap around.
            */
            
        }
    }



    
    

}