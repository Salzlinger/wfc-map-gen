from collections import Counter
from itertools import chain
from random import choice, sample

w, h = 96, 50  # dimensions of output (array of wxh cells)
f = 9 # size factor 
N = 3 # dimensions of a pattern (NxN matrix)

def setup():
    size(w*f, h*f, P2D)
    background('#FFFFFF')
    frameRate(1000)
    noStroke()
    
    global W, A, H, directions, patterns, freqs, xs, ys
    
    img = loadImage('Flowers.png') # path to the input image
    iw, ih = img.width, img.height # dimensions of input image
    xs, ys = width//w, height//h # dimensions of cells (rect) in output
    kernel = tuple(tuple(i + n*iw for i in xrange(N)) for n in xrange(N)) # NxN matrix to read every patterns contained in input image
    directions = ((-1, 0), (1, 0), (0, -1), (0, 1)) # (x, y) tuples to access the 4 neighboring cells of a specific cell
    all = [] # array list to store all the patterns found in input
    
          
   
    #### Stores the different patterns found in input 
    
    for y in xrange(ih):
        for x in xrange(iw):
            
            ''' The one-liner below (cmat) creates a NxN matrix with (x, y) being its top left corner.
                This matrix will wrap around the edges of the input image.
                The whole snippet reads every NxN part of the input image and store the associated colors.
                Each NxN part is called a 'pattern' (of colors). Each pattern can be rotated or flipped (not mandatory). '''
                
            cmat = tuple(tuple(img.pixels[((x+n)%iw)+(((a[0]+iw*y)/iw)%ih)*iw] for n in a) for a in kernel)
            
            # Storing rotated patterns (90°, 180°, 270°, 360°)
            for r in xrange(4):
                cmat = zip(*cmat[::-1]) # +90° rotation
                all.append(cmat)
                all.append(cmat[::-1]) # vertical flip
                all.append([a[::-1] for a in cmat]) # horizontal flip 

    
    
    #### Flatten pattern matrices + count occurences 
    
    ''' Once every pattern has been stored,
        - we flatten them (convert to 1D) for convenience
        - count the number of occurences for each one of them (one pattern can be found multiple times in input)
        - select and store unique patterns only '''
    
    all = [tuple(chain.from_iterable(p)) for p in all]  # flattening arrays
    c = Counter(all) # Python counter
    freqs = c.values() # number of occurences for each unique pattern
    patterns = c.keys() # list of unique patterns
    npat = len(freqs) # number of unique patterns
    
    
    
    #### Initializes the 'wave' (W), entropy (H) and adjacencies (A) array lists
    
    ''' Array W (the Wave) keeps track of all the available patterns, for each cell.
        At start start, all patterns are valid anywhere in the Wave so each subarray
        is a list of indices of all the patterns'''
    
    W = dict(enumerate(tuple(set(range(npat)) for i in xrange(w*h)))) 
    
   
     ''' Array H should normally be populated with entropy values.
        Entropy is just a fancy way to represent the number of patterns 
        still available in a cell. We can skip this computation and populate 
        the array with the number of available patterns instead.
        
        At start all patterns are valid anywhere in the Wave, so all cells 
        share the same value (npat). We must however pick one cell at random and
        assign a lower value to it. Why ? Because the algorithm in draw() needs
        to find a cell with the minimum non-zero entropy value. '''

    H = dict(enumerate(sample(tuple(npat if i > 0 else npat-1 for i in xrange(w*h)), w*h))) 
    
    
    ''' Array A (for Adjacencies) is an index datastructure that describes the ways 
        that the patterns can be placed near one another. More explanations below '''
    
    A = dict(enumerate(tuple(set() for dir in xrange(len(directions))) for i in xrange(npat))) # explanations below
    
    
    
    #### Computation of patterns compatibilities (check if some patterns are adjacent, if so -> store them based on their location)
    
    ''' EXAMPLE:
        If pattern index 42 can placed to the right of pattern index 120,
        we will store this adjacency rule as follow:
    
                        A[120][1].add(42)
    
        Here '1' stands for 'right' or 'East'/'E'
    
        0 = left or West/W
        1 = right or East/E
        2 = up or North/N
        3 = down or South/S '''
        
    # Comparing patterns to each other
    for i1 in xrange(npat):
        for i2 in xrange(npat):
            
            ''' (in case when N = 3) If the first two columns of pattern 1 == the last two columns of pattern 2 
                 --> pattern 2 can be placed to the left (0) of pattern 1 '''
            
            if [n for i, n in enumerate(patterns[i1]) if i%N!=(N-1)] == [n for i, n in enumerate(patterns[i2]) if i%N!=0]:
                A[i1][0].add(i2)
                A[i2][1].add(i1)
                
            
            ''' (in case when N = 3) If the first two rows of pattern 1 == the last two rows of pattern 2
                --> pattern 2 can be placed on top (2) of pattern 1  '''
            
            if patterns[i1][:(N*N)-N] == patterns[i2][N:]:
                A[i1][2].add(i2)
                A[i2][3].add(i1)
           
          
def draw():    
    global H, W
    
    
    # Simple stopping mechanism
    
    ''' If the dict (or arraylist) of entropies is empty -> stop iterating.
        We'll see later that each time a cell is collapsed, its corresponding key
        in H is deleted '''
    
    if not H:
        print 'finished'
        noLoop()
        return
    
    
    
    #### OBSERVATION
    
    ''' Find cell with minimum non-zero entropy (not collapsed yet).'''
    
    emin = min(H, key = H.get) 
    
    
    
    #### COLLAPSE
    
    ''' Among the patterns available in the selected cell (the one with min entropy), 
        select one pattern randomly, weighted by the frequency that pattern appears 
        in the input image.'''
        
    id = choice([idP for idP in W[emin] for i in xrange(freqs[idP])]) # index of selected pattern 
    
    
    
    ''' The Wave's subarray corresponding to the cell with min entropy should now only contains 
        the id of the selected pattern '''
        
    W[emin] = {id} 
    
    
    
    ''' Its key can be deleted in the dict of entropies '''
        
    del H[emin]
    
    
    
    #### PROPAGATION
    
    ''' Once a cell is collapsed, its index is put in a stack. 
        That stack is meant later to temporarily store indices of neighoring cells '''
        
    stack = {emin}
    
    
    
    ''' The propagation will last as long as that stack is filled with indices '''
    
    while stack:
        
    
    
    ''' First thing we do is pop() the last index contained in the stack (the only one for now) 
        and get the indices of its 4 neighboring cells (E, W, N, S). 
        We have to keep them withing bounds and make sure they wrap around. '''
        
        idC = stack.pop() # index of current cell
        for dir, t in enumerate(directions):
            x = (idC%w + t[0])%w
            y = (idC/w + t[1])%h
            idN = x + y * w # index of negihboring cell
            
            
            
    ''' We make sure the neighboring cell is not collapsed yet 
        (we don't want to update a cell that has only 1 pattern available) '''
            
            if idN in H: 
                
                
                
    ''' Then we check all the patterns that COULD be placed at that location. 
        EX: if the neighboring cell is on the left of the current cell (east side), 
        we look at all the patterns that can be placed on the left of each pattern 
        contained in the current cell. '''
        
                possible = {n for idP in W[idC] for n in A[idP][dir]}
                
              
                  
    ''' We also look at the patterns that ARE available in the neighboring cell '''
    
                available = W[idN]
                
                
                
    ''' Now we make sure that the neighboring cell really need to be updated. 
        If all its available patterns are already in the list of all the possible patterns:
         —> there’s no need to update it (the algorithm skip this neighbor and goes on to the next) '''
         
                if not available.issubset(possible):
                    
                    
                    
    ''' If it is not a subset of the possible list:
        —> we look at the intersection of the two sets (all the patterns that can be placed 
        at that location and that, "luckily", are available at that same location) '''             
                    
                    intersection = possible & available 
                
                
                
    ''' If they don't intersect (patterns that could have been placed there but are not available) 
        it means we ran into a "contradiction". We have to stop the whole WFC algorithm. '''
                   
                    if not intersection:
                        print 'contradiction'
                        noLoop()
                        return
                        
                        
                        
    ''' If, on the contrary, they do intersect -> we update the neighboring cell with that refined 
        list of pattern's indices '''
        
                    W[idN] = intersection
                    
                    
                    
    ''' Because that neighboring cell has been updated, its number of valid patterns has decreased
        and its entropy must be updated accordingly.
        Note that we're subtracting a small random value to mix things up: sometimes cells we'll
        end-up with the same minimum entropy value and this prevent to always select the first one of them.
        It's a cosmetic trick to break the monotony of the animation'''               
                    
                    H[idN] = len(W[idN]) - random(.1)
                    
                    
                    
    ''' Finally, and most importantly, we add the index of that neighboring cell to the stack 
        so it becomes the next current cell in turns (the one whose neighbors will be updated 
        during the next while loop) '''
        
                    stack.add(idN)



    #### RENDERING
    ''' The collapsed cell will always be filled with the first color (top left corner) of the
        selected pattern '''
        
    fill(patterns[id][0])
    rect((emin%w) * xs, (emin/w) * ys, xs, ys)