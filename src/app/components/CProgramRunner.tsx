'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEmscripten } from '../hooks/useEmscipten';

interface CProgramRunnerProps {
  programName: string; // Display name
  scriptPath: string;  // Path to the Emscripten JS file (e.g., "/minigame.js")
  programId: string;   // Unique ID for the program, used for constructing C function names (e.g., "minigame")
  initFunctionNameOverride?: string; // Optional: e.g., "init_minigame"
  processInputFunctionNameOverride?: string; // Optional: e.g., "process_minigame_guess"
}

// Keep declare global for Window.Module if other parts of your app might access it,
// though the hook encapsulates its direct management for this component.
// declare global {
//   interface Window {
//     Module?: any;
//   }
// }

const CProgramRunner: React.FC<CProgramRunnerProps> = ({
  programName,
  scriptPath,
  programId,
  initFunctionNameOverride,
  processInputFunctionNameOverride,
}) => {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const outputContainerRef = useRef<HTMLPreElement>(null);

  const { isLoaded, moduleRef, setIsLoaded } = useEmscripten({
    programName,
    scriptPath,
    programId,
    setOutput,
  });

  // Effect to reset isRunning when the program/script changes (isLoaded becomes false)
  useEffect(() => {
    if (!isLoaded) {
      setIsRunning(false);
      // Optionally clear output when a new program is about to load or fails
      // setOutput([]); 
    }
  }, [isLoaded]);


  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [output]);

  const getInitFunctionName = () => {
    return initFunctionNameOverride || `init_${programId}`;
  }

  const getProcessInputFunctionName = () => {
    if (programId === "minigame" && !processInputFunctionNameOverride) return "process_minigame_guess";
    return processInputFunctionNameOverride || `process_${programId}_input`;
  }

  const handleInitializeProgram = () => {
    const initFnName = getInitFunctionName(); 
    const actualModuleFunctionName = '_' + initFnName; 

    if (isLoaded && moduleRef.current && typeof moduleRef.current.ccall === 'function') {
      try {
        if (typeof moduleRef.current[actualModuleFunctionName] === 'function') {
          moduleRef.current.ccall(initFnName, 'void', [], []);
          setIsRunning(true);
        } else if (typeof moduleRef.current._main === 'function') { 
          moduleRef.current.callMain([]); // or moduleRef.current._main();
          setIsRunning(true); 
        } else {
          const msg = `[${programId}] No suitable init function ('${actualModuleFunctionName}' or '_main') found on Module.`;
          console.error(msg, moduleRef.current);
          setOutput(prev => [...prev, msg]);
        }
      } catch (e: any) {
        console.error(`[${programId}] Error initializing/running:`, e);
        setOutput(prev => [...prev, `Error: ${e.message || String(e)}`]);
      }
    } else {
      const msg = `[${programId}] Module not ready or ccall not available for initialization. Loaded: ${isLoaded}, Module: ${!!moduleRef.current}`;
      console.warn(msg);
      setOutput(prev => [...prev, msg]);
    }
  };

  const handleSendInput = () => {
    const processFnName = getProcessInputFunctionName();
    const actualModuleProcessFnName = '_' + processFnName;

    // First, check if there's any input. If not, show message and stop.
    if (!inputValue.trim()) {
      setOutput(prev => [...prev, "Please type an input before sending."]);
      // Optionally, you might want to clear inputValue if it's just whitespace
      // setInputValue(''); 
      return;
    }

    // Next, check if the module is ready to process anything.
    if (!isLoaded || !moduleRef.current || typeof moduleRef.current.ccall !== 'function') {
      const msg = `[${programId}] Module not ready to process input. Loaded: ${isLoaded}, Running: ${isRunning}, Module: ${!!moduleRef.current}`;
      console.warn(msg);
      setOutput(prev => [...prev, msg]);
      return;
    }

    // If we've reached here, input is present and the module is ready.
    // Echo the user's input to the output.
    setOutput(prev => [...prev, `> ${inputValue}`]);

    try {
      // Check if the specific C input processing function exists.
      if (typeof moduleRef.current[actualModuleProcessFnName] === 'function') {
        const ccallOptions: { async?: boolean } = {};
        if (programId === "jukebox") { // Or a more generic way to detect async functions
            ccallOptions.async = true;
        }
        
        moduleRef.current.ccall(
            processFnName,
            'void',      // return type
            ['string'],  // argument types
            [inputValue], // arguments
            ccallOptions 
        );
        // The C function's own printf statements (with fflush) will be caught by
        // the 'print' callback in useEmscripten and added to the output.
      } else {
        const msg = `[${programId}] Input handling function '${actualModuleProcessFnName}' not found on Module. Check export settings.`;
        console.warn(msg, moduleRef.current);
        setOutput(prev => [...prev, msg]);
      }
    } catch (e: any) {
      console.error(`[${programId}] Error sending input:`, e);
      setOutput(prev => [...prev, `Error sending input: ${e.message || String(e)}`]);
    }

    // Finally, clear the input field for the next input.
    setInputValue('');
  };

  return (
    <div style={{ border: '1px solid lightgray', padding: '0.5em', margin: '1em 0', backgroundColor: '#28282B', color: 'white' }}>
      
      {!isRunning && isLoaded && (
        <button 
          onClick={handleInitializeProgram} 
          disabled={!isLoaded}
          className="cprogram-runner-button"
        >
          Start
        </button>
      )}
      
      {isLoaded && isRunning && (
        <div style={{ margin: '1em 0' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter input for the program"
            style={{ marginRight: '0.5em', padding: '0.5em', color: 'black', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
            onKeyPress={(e) => { if (e.key === 'Enter') handleSendInput(); }}
          />
          <button 
            onClick={handleSendInput} 
            className="cprogram-runner-button"
            disabled={!moduleRef.current?.['_' + getProcessInputFunctionName()]}
          >
            Send Input
          </button>
        </div>
      )}

      <h5>Output:</h5>
      <pre 
        ref={outputContainerRef} 
        style={{ backgroundColor: 'black', border: '1px solid #333', padding: '0.5em', minHeight: '100px', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {output.join('\n')}
      </pre>
      <p style={{fontSize: '0.8em', color: 'gray'}}>
        <strong>Note:</strong> Click &quot;Start&quot; first. Then enter your input.
      </p>
    </div>
  );
};

export default CProgramRunner;