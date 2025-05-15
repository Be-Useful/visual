import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Added useRef

// Helper to generate a color for each disk
const DISK_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  'bg-red-400', 'bg-orange-400' // Extra colors if more than 8 disks were allowed
];

// Component to display the towers and disks
function TowerDisplay({ rods, numDisks, moveCount }) {
  const getDiskWidth = (diskValue) => {
    const minWidthPercentage = 20; // Smallest disk
    const maxWidthPercentage = 100; // Largest disk
    if (numDisks <= 1) return maxWidthPercentage; // Single disk takes full width
    // Scale width linearly from min to max based on diskValue
    return minWidthPercentage + ((maxWidthPercentage - minWidthPercentage) / (numDisks - 1) * (diskValue - 1));
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 bg-blue-100 px-3 py-1 rounded-lg shadow-sm">
        <span className="text-sm font-semibold text-blue-700">Disk Moves: {moveCount}</span>
      </div>
      <div className="flex justify-around items-end h-64 md:h-80 p-4 bg-gray-200 rounded-lg shadow-inner select-none">
        {['A', 'B', 'C'].map(rodId => (
          <div key={rodId} className="flex flex-col-reverse items-center w-1/4 h-full relative">
            {/* Rod Pole */}
            <div className="w-2 md:w-3 bg-gray-700 h-full rounded-t-md"></div>
            {/* Disks on this rod */}
            <div className="absolute bottom-0 w-full flex flex-col-reverse items-center">
              {rods[rodId] && rods[rodId].map((disk) => (
                <div
                  key={disk}
                  className={`h-6 md:h-7 rounded-md shadow-md flex items-center justify-center text-white font-bold text-xs md:text-sm mb-0.5 ${DISK_COLORS[(disk - 1) % DISK_COLORS.length]}`}
                  style={{ width: `${getDiskWidth(disk)}%` }}
                  title={`Disk ${disk}`}
                >
                  {disk}
                </div>
              ))}
            </div>
            {/* Rod Label */}
            <p className="mt-2 text-xl font-bold text-gray-700">{rodId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for control buttons
function Controls({
  onStartReset, onPlayPause, onStepForward, onStepBackward,
  isPlaying, numDisks, setNumDisks, isFinished, currentStep, totalSteps
}) {
  return (
    <div className="my-6 p-4 bg-gray-100 rounded-lg shadow">
      <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="numDisks" className="text-sm font-medium text-gray-700">Number of Disks (1-8):</label>
          <input
            type="number"
            id="numDisks"
            min="1"
            max="8" // More than 8 disks generate too many steps and a very large tree
            value={numDisks}
            onChange={(e) => setNumDisks(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
            className="p-2 border border-gray-300 rounded-md shadow-sm w-20 text-center"
            disabled={isPlaying || (currentStep > 0 && currentStep < totalSteps - 1) } // Disable if mid-simulation
          />
        </div>
        <button
          onClick={onStartReset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
          // Allow reset even if playing to stop and restart
        >
          Start / Reset
        </button>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-3">
        <button
          onClick={onStepBackward}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
          disabled={isPlaying || currentStep <= 0} // Disable if playing or at the first step
        >
          {'<'} Step Back
        </button>
        <button
          onClick={onPlayPause}
          className={`px-6 py-2 font-semibold rounded-lg shadow-md transition duration-150 ease-in-out text-white disabled:opacity-50 ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
          disabled={isFinished && !isPlaying} // Disable if finished and not playing (i.e. already paused at end)
        >
          {isPlaying ? 'Pause' : (isFinished ? 'Finished' : 'Play')}
        </button>
        <button
          onClick={onStepForward}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
          disabled={isPlaying || isFinished} // Disable if playing or at the last step
        >
          Step Forward {'>'}
        </button>
      </div>
      {totalSteps > 0 && (
        <p className="text-center mt-3 text-sm text-gray-600">
          Step: {currentStep + 1} / {totalSteps}
        </p>
      )}
    </div>
  );
}

// Component to display current action and call stack
function InfoDisplay({ description, callStack }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mt-6">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">Current Action / Log</h3>
        <div className="text-sm text-gray-700 h-32 overflow-y-auto font-mono break-words bg-gray-50 p-3 rounded border border-gray-200">
          {description || 'Press Start/Reset to begin.'}
        </div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">Call Stack</h3>
        <div className="h-48 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-200">
          <div className="flex flex-col-reverse">
            {callStack.length > 0 ? callStack.map((call, index) => {
              const isPopping = call.startsWith('RETURN');
              const isPushing = call.startsWith('CALL');
              const isCurrentCall = index === callStack.length - 1;
              
              return (
                <div 
                  key={index} 
                  className={`mb-2 p-2 rounded shadow-sm border text-xs font-mono transition-all duration-300 ${
                    isPopping 
                      ? 'bg-red-100 border-red-300 text-red-800' 
                      : isPushing 
                        ? 'bg-green-100 border-green-300 text-green-800' 
                        : isCurrentCall
                          ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold'
                          : 'bg-white border-gray-200'
                  }`}
                  style={{ 
                    transform: `translateX(${index * 8}px) ${isPopping ? 'translateX(32px)' : isPushing ? 'translateX(-16px)' : ''}`,
                    zIndex: callStack.length - index,
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    opacity: isPopping ? 0.5 : 1
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{call}</span>
                  </div>
                  {isCurrentCall && !isPopping && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 animate-pulse"></div>
                  )}
                </div>
              );
            }) : (
              <div className="text-gray-500 text-center py-4">
                <div className="text-lg mb-2">📚</div>
                <div>Stack is empty</div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
            <span>Called</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div>
            <span>Returning</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Recursion Tree Components ---
function TreeNode({ node, allNodesMap, activeNodeId, nodePhase, depth, currentStepIndex }) {
    if (node.firstStepIndex === undefined || currentStepIndex < node.firstStepIndex) {
        return null;
    }

    const isNodeActive = node.id === activeNodeId;
    const hasReturned = node.lastStepIndex !== undefined && currentStepIndex >= node.lastStepIndex;

    let nodeClasses = `w-24 h-24 rounded-full flex items-center justify-center text-xs font-mono transition duration-100 ease-in-out 
                      shadow-sm border-2 relative`; // Circular node

    // Base styles
    nodeClasses += ` border-gray-300 bg-gray-50 text-gray-700`;

    // Phase-based styling
    if (isNodeActive) {
        nodeClasses = nodeClasses.replace('border-gray-300', 'border-orange-600');
        nodeClasses = nodeClasses.replace('font-mono', 'font-semibold');
        nodeClasses += ' shadow-md';

        if (nodePhase === 'entering_call') nodeClasses = nodeClasses.replace('bg-gray-50', 'bg-cyan-100');
        else if (nodePhase === 'processing_move_base' || nodePhase === 'processing_move_N_done') nodeClasses = nodeClasses.replace('bg-gray-50', 'bg-green-100');
        else if (nodePhase && nodePhase.startsWith('before_recursion')) nodeClasses = nodeClasses.replace('bg-gray-50', 'bg-yellow-100');
        else if (nodePhase === 'processing_move_N') nodeClasses = nodeClasses.replace('bg-gray-50', 'bg-indigo-100');
    }

    if (hasReturned) {
        if (!isNodeActive || nodePhase === 'finished') {
            nodeClasses = nodeClasses.replace(/bg-\w+-\d+/, 'bg-gray-200');
            nodeClasses = nodeClasses.replace(/border-\w+-\d+/, 'border-gray-400');
            nodeClasses = nodeClasses.replace('text-gray-700', 'text-gray-500');
            nodeClasses = nodeClasses.replace('shadow-md', 'shadow-sm');
            nodeClasses = nodeClasses.replace('font-semibold', 'font-mono');
        }
    }

    if (isNodeActive && (nodePhase === 'returning_base' || nodePhase === 'returning_N')) {
        nodeClasses = nodeClasses.replace('bg-gray-50', 'bg-red-100');
        nodeClasses = nodeClasses.replace('text-gray-700', 'text-red-800');
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center relative">
                {/* Horizontal connection line */}
                {depth > 0 && (
                    <div className="w-16 h-px bg-gray-400 absolute -left-16 top-1/2 transform -translate-y-1/2"></div>
                )}
                <div
                    className={nodeClasses}
                    title={`Node ID: ${node.id}, N: ${node.n}, ${node.from}->${node.to} via ${node.aux}${isNodeActive ? ', Phase: ' + nodePhase : ''}${hasReturned ? ', Returned' : ''}`}
                >
                    <div className="text-center">
                        <div className="font-bold">{node.label}</div>
                        {hasReturned && <span className="text-gray-600">&#x2713;</span>}
                    </div>
                </div>
            </div>
            
            {/* Children container */}
            {node.childrenIds && node.childrenIds.length > 0 && (
                <div className="flex justify-center mt-4 relative">
                    {/* Vertical connection line */}
                    <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-400 transform -translate-x-1/2"></div>
                    {node.childrenIds.map(childId => {
                        const childNode = allNodesMap[childId];
                        return childNode ? (
                            <TreeNode
                                key={childNode.id}
                                node={childNode}
                                allNodesMap={allNodesMap}
                                activeNodeId={activeNodeId}
                                nodePhase={nodePhase}
                                depth={depth + 1}
                                currentStepIndex={currentStepIndex}
                            />
                        ) : null;
                    })}
                </div>
            )}
        </div>
    );
}

function RecursionTreeDisplay({ treeStructure, activeNodeId, nodePhase, currentStepIndex }) {
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (activeNodeId && scrollContainerRef.current) {
            const activeNodeElement = scrollContainerRef.current.querySelector(
                `[title*="Node ID: ${activeNodeId}"]`
            );

            if (activeNodeElement) {
                activeNodeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [activeNodeId, currentStepIndex]);

    if (!treeStructure || treeStructure.length === 0 || currentStepIndex < 0) {
        return (
            <div className="p-4 bg-gray-100 rounded-lg shadow mt-6 text-center text-gray-500">
                <p>Recursion tree will appear here as the algorithm runs.</p>
            </div>
        );
    }

    const rootNodes = treeStructure.filter(node => !node.parentId);
    const allNodesMap = treeStructure.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
    }, {});

    return (
        <div className="my-6 p-4 bg-gray-100 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Recursion Tree</h3>
            <div className="text-xs text-gray-600 mb-3 flex flex-wrap gap-2">
                <span className="inline-block px-2 py-1 rounded-full bg-cyan-100 border border-cyan-200">Entering Call</span>
                <span className="inline-block px-2 py-1 rounded-full bg-yellow-100 border border-yellow-200">Before Recurse</span>
                <span className="inline-block px-2 py-1 rounded-full bg-indigo-100 border border-indigo-200">Processing Move (N)</span>
                <span className="inline-block px-2 py-1 rounded-full bg-green-100 border border-green-200">Move Disk (Base/N)</span>
                <span className="inline-block px-2 py-1 rounded-full bg-red-100 border border-red-200">Returning</span>
                <span className="inline-block px-2 py-1 rounded-full bg-gray-200 border border-gray-400 text-gray-500">Returned/Completed</span>
            </div>
            <div ref={scrollContainerRef} className="overflow-auto bg-white p-6 rounded shadow-inner border border-gray-200">
                <div className="flex justify-center">
                    {rootNodes.map(rootNode => (
                        <TreeNode
                            key={rootNode.id}
                            node={rootNode}
                            allNodesMap={allNodesMap}
                            activeNodeId={activeNodeId}
                            nodePhase={nodePhase}
                            depth={0}
                            currentStepIndex={currentStepIndex}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
// --- End Recursion Tree Components ---


// Main App Component
function App() {
  const [numDisks, setNumDisks] = useState(3);
  const [allSteps, setAllSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // Start at -1 for "not yet started" state
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [treeStructure, setTreeStructure] = useState([]);

  // Memoized current step data
  const currentStepData = useMemo(() => {
    if (currentStepIndex >= 0 && currentStepIndex < allSteps.length) {
      return allSteps[currentStepIndex];
    }
    // Initial state before any steps are generated or when reset
    const initialRodsState = { A: [], B: [], C: [] };
    for (let i = numDisks; i >= 1; i--) {
      initialRodsState.A.push(i);
    }
    return {
      rods: initialRodsState,
      callStack: [],
      description: `Set number of disks (currently ${numDisks}) and press Start/Reset.`,
      moveDetails: null,
      isCall: false,
      isReturn: false,
      activeNodeId: null,
      nodePhase: 'initial',
    };
  }, [currentStepIndex, allSteps, numDisks]);

  // Calculate actual disk moves
  const actualMoves = useMemo(() => {
    if (currentStepIndex < 0) return 0;
    return allSteps.slice(0, currentStepIndex + 1).filter(step => 
      step.nodePhase === 'processing_move_base' || step.nodePhase === 'processing_move_N_done'
    ).length;
  }, [currentStepIndex, allSteps]);

  const generateTowerOfHanoiSteps = useCallback((n_disks) => {
    const steps = [];
    const callStack = [];
    const tempRods = { A: [], B: [], C: [] };
    for (let i = n_disks; i >= 1; i--) {
        tempRods.A.push(i);
    }

    let _nodeIdCounter = 0;
    const generatedTreeNodes = [];
    const nodeMap = {}; // Helper to quickly find nodes by ID


    function recordStep(description, activeNodeId, nodePhase, moveDetails = null, isCall = false, isReturn = false) {
        steps.push({
            rods: JSON.parse(JSON.stringify(tempRods)),
            callStack: [...callStack],
            description: description,
            moveDetails: moveDetails,
            isCall,
            isReturn,
            activeNodeId: activeNodeId,
            nodePhase: nodePhase,
        });
    }

    recordStep(`Initial state with ${n_disks} disks on Rod A.`, null, 'initial_setup');

    function tohRecursive(count, from, to, aux, parentNodeId) {
        _nodeIdCounter++;
        const currentNodeId = `treeNode-${_nodeIdCounter}`;
        const nodeLabel = `H(${count}, ${from}, ${to}, ${aux})`;

        const newNode = {
            id: currentNodeId,
            parentId: parentNodeId,
            label: nodeLabel,
            n: count, from, to, aux,
            childrenIds: [],
            firstStepIndex: steps.length // Store the step index when this node's call starts
        };
        generatedTreeNodes.push(newNode);
        nodeMap[currentNodeId] = newNode; // Add to map


        if (parentNodeId) {
            const parentNode = nodeMap[parentNodeId]; // Use map for efficiency
            if (parentNode) parentNode.childrenIds.push(currentNodeId);
        }

        const callSignature = `towerOfHanoi(${count}, '${from}', '${to}', '${aux}')`;
        callStack.push(callSignature);
        recordStep(`CALL: ${callSignature}`, currentNodeId, 'entering_call', null, true, false);

        if (count === 1) {
            const diskToMove = tempRods[from].pop();
            if (diskToMove !== undefined) tempRods[to].push(diskToMove); // Check if pop was successful
            recordStep(`MOVE: Disk ${diskToMove !== undefined ? diskToMove : '?'} from Rod ${from} to Rod ${to}`, currentNodeId, 'processing_move_base', { disk: diskToMove, from, to });

            callStack.pop();
            // Mark node as returning/returned
            nodeMap[currentNodeId].lastStepIndex = steps.length; // Store step index when this node's return starts
            recordStep(`RETURN from ${callSignature}`, currentNodeId, 'returning_base', null, false, true);
            return;
        }

        recordStep(`Preparing for 1st recursive call from ${nodeLabel} (move ${count-1} disks from ${from} to ${aux})`, currentNodeId, 'before_recursion_1');
        tohRecursive(count - 1, from, aux, to, currentNodeId);

        recordStep(`Returned from 1st call. Moving disk ${count} from ${from} to ${to} for ${nodeLabel}`, currentNodeId, 'processing_move_N');
        const diskToMove = tempRods[from].pop();
        if (diskToMove !== undefined) tempRods[to].push(diskToMove);
        recordStep(`MOVE: Disk ${diskToMove !== undefined ? diskToMove : '?'} from Rod ${from} to Rod ${to}`, currentNodeId, 'processing_move_N_done', { disk: diskToMove, from, to });

        recordStep(`Preparing for 2nd recursive call from ${nodeLabel} (move ${count-1} disks from ${aux} to ${to})`, currentNodeId, 'before_recursion_2');
        tohRecursive(count - 1, aux, to, from, currentNodeId);

        callStack.pop();
        // Mark node as returning/returned
        nodeMap[currentNodeId].lastStepIndex = steps.length; // Store step index when this node's return starts
        recordStep(`RETURN from ${callSignature}`, currentNodeId, 'returning_N', null, false, true);
    }

    if (n_disks > 0) { // Only run if there are disks
        tohRecursive(n_disks, 'A', 'C', 'B', null);
    }
    recordStep("Algorithm finished.", null, 'finished'); // Final step
   
    return { steps, treeStructure: generatedTreeNodes };
  }, []);


  const handleStartReset = () => {
    setIsPlaying(false);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);

    const { steps: generatedSteps, treeStructure: generatedTree } = generateTowerOfHanoiSteps(numDisks);
    setAllSteps(generatedSteps);
    setTreeStructure(generatedTree);
    setCurrentStepIndex(0); // Start at the first recorded step (initial state)
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalId) clearInterval(intervalId);
      setIntervalId(null);
    } else {
      if (currentStepIndex < allSteps.length - 1) {
        setIsPlaying(true);
        const newIntervalId = setInterval(() => {
          setCurrentStepIndex(prevIndex => {
            if (prevIndex < allSteps.length - 1) {
              return prevIndex + 1;
            } else {
              clearInterval(newIntervalId); // Clear interval when end is reached
              setIsPlaying(false);
              return prevIndex; // Stay at the last index
            }
          });
        }, 800); // Speed of play (milliseconds) - adjust as needed
        setIntervalId(newIntervalId);
      }
    }
  };

  const handleStepForward = () => {
    if (!isPlaying && currentStepIndex < allSteps.length - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    }
  };

  const handleStepBackward = () => {
    if (!isPlaying && currentStepIndex > 0) {
      setCurrentStepIndex(prevIndex => prevIndex - 1);
    } else if (!isPlaying && currentStepIndex === 0) {
        // If at the first step and step back, reset to initial state (-1)
        setCurrentStepIndex(-1);
    }
  };

  // Effect to clear interval when component unmounts or when allSteps changes (e.g. on reset)
  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]); // Only re-run if intervalId changes

   // Effect to handle play/pause state when reaching the end during play
   useEffect(() => {
    if (isPlaying && currentStepIndex >= allSteps.length - 1 && allSteps.length > 0) {
      setIsPlaying(false); // Automatically pause
      if (intervalId) clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [currentStepIndex, allSteps, isPlaying, intervalId]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-4 md:p-6 text-gray-900 font-sans">
      <div className="container mx-auto max-w-6xl bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl">
        <header className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Tower of Hanoi Visualizer
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Watch the recursive algorithm in action with call stack and recursion tree.
          </p>
        </header>

        <main className="space-y-4">
          <Controls
            onStartReset={handleStartReset}
            onPlayPause={handlePlayPause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            isPlaying={isPlaying}
            numDisks={numDisks}
            setNumDisks={setNumDisks}
            isFinished={currentStepIndex >= allSteps.length - 1 && allSteps.length > 0}
            currentStep={currentStepIndex}
            totalSteps={allSteps.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Tower Display */}
              {allSteps.length > 0 && currentStepIndex >= 0 ? (
                <TowerDisplay 
                  rods={currentStepData.rods} 
                  numDisks={numDisks} 
                  moveCount={actualMoves} 
                />
              ) : (
                <div className="flex justify-around items-end h-64 md:h-80 p-4 bg-gray-200 rounded-lg shadow-inner select-none">
                  {currentStepIndex === -1 && (
                    <>
                      <div className="flex flex-col-reverse items-center w-1/4 h-full relative">
                        <div className="w-2 md:w-3 bg-gray-700 h-full rounded-t-md"></div>
                        <div className="absolute bottom-0 w-full flex flex-col-reverse items-center">
                          {Array.from({ length: numDisks }, (_, i) => numDisks - i).map((disk) => (
                            <div
                              key={disk}
                              className={`h-6 md:h-7 rounded-md shadow-md flex items-center justify-center text-white font-bold text-xs md:text-sm mb-0.5 ${DISK_COLORS[(disk - 1) % DISK_COLORS.length]}`}
                              style={{ width: `${(20 + ((100 - 20) / (numDisks - 1) * (disk - 1)))}%` }}
                              title={`Disk ${disk}`}
                            >
                              {disk}
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-xl font-bold text-gray-700">A</p>
                      </div>
                      <div className="flex flex-col-reverse items-center w-1/4 h-full relative">
                        <div className="w-2 md:w-3 bg-gray-700 h-full rounded-t-md"></div>
                        <p className="mt-2 text-xl font-bold text-gray-700">B</p>
                      </div>
                      <div className="flex flex-col-reverse items-center w-1/4 h-full relative">
                        <div className="w-2 md:w-3 bg-gray-700 h-full rounded-t-md"></div>
                        <p className="mt-2 text-xl font-bold text-gray-700">C</p>
                      </div>
                    </>
                  )}
                  {currentStepIndex !== -1 && <p className="text-gray-500 self-center">Visualization loading...</p>}
                  {currentStepIndex === -1 && allSteps.length === 0 && (
                    <p className="text-gray-500 self-center absolute w-full text-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      Set number of disks and press "Start / Reset" to begin visualization.
                    </p>
                  )}
                </div>
              )}

              {/* Info Display */}
              <InfoDisplay
                description={currentStepData.description}
                callStack={currentStepData.callStack}
              />
            </div>

            {/* Recursion Tree */}
            <div className="lg:sticky lg:top-4">
              <RecursionTreeDisplay
                treeStructure={treeStructure}
                activeNodeId={currentStepData.activeNodeId}
                nodePhase={currentStepData.nodePhase}
                currentStepIndex={currentStepIndex}
              />
            </div>
          </div>
        </main>

        <footer className="text-center mt-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Visualizer to explain the Tower of Hanoi algorithm.</p>
          <p className="text-xs text-gray-500">The recursive Java code's logic is mirrored in the JavaScript function generating the steps.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;