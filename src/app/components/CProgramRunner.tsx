'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CProgramRunnerProps {
  programName: string; // Display name
  scriptPath: string;  // Path to the Emscripten JS file (e.g., "/minigame.js")
  programId: string;   // Unique ID for the program, used for constructing C function names (e.g., "minigame")
  initFunctionNameOverride?: string; // Optional: e.g., "init_minigame"
  processInputFunctionNameOverride?: string; // Optional: e.g., "process_minigame_guess"
}

declare global {
  interface Window {
    Module?: any;
    // ExitStatus is often declared by Emscripten, but we can't reliably delete it in strict mode
    // if it's not a direct property of window.
  }
}

const CProgramRunner: React.FC<CProgramRunnerProps> = ({
  programName,
  scriptPath,
  programId,
  initFunctionNameOverride,
  processInputFunctionNameOverride,
}) => {
  const [output, setOutput] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const moduleRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const scriptId = `emscripten-script-${programId}`;
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    console.log(`[${programId}] useEffect: Starting setup for ${programName}.`);

    // --- Cleanup Phase ---
    if (scriptElement) {
      console.log(`[${programId}] Removing existing script tag: ${scriptId}`);
      scriptElement.remove();
    }
    
    // The most important part for re-loading is to ensure window.Module is undefined
    // so the new script can initialize it.
    if (window.Module) {
      console.warn(`[${programId}] Deleting window.Module before loading new script.`);
      // If the old module had an exit or shutdown, try to call it.
      if (typeof window.Module.exit === 'function') {
        try { window.Module.exit(); } catch (e) { console.warn(`[${programId}] Error calling exit on old Module:`, e); }
      }
      delete window.Module;
    }
    // --- End Cleanup Phase ---

    // Reset states for the new load attempt
    setIsLoaded(false);
    setIsRunning(false);
    moduleRef.current = null;
    // setOutput([]); // Consider clearing output when a new program instance is about to load

    scriptElement = document.createElement('script');
    scriptElement.id = scriptId;
    scriptElement.src = scriptPath;
    scriptElement.async = true; // Ensure script loads asynchronously
    scriptElement.type = 'text/javascript';

    // Error handling for script loading itself
    scriptElement.onerror = () => {
        console.error(`[${programId}] Failed to load script: ${scriptPath}`);
        setOutput(prev => [...prev, `ERROR: Failed to load script ${scriptPath}. Check console and network tab.`]);
        setIsLoaded(false); // Ensure it's marked as not loaded
    };

    console.log(`[${programId}] Preparing new window.Module object.`);
    // This Module object will be populated by the Emscripten script
    window.Module = {
      print: (text: string) => {
        console.log(`[${programId} STDOUT]:`, text);
        setOutput(prev => [...prev, text]);
      },
      printErr: (text: string) => {
        console.error(`[${programId} STDERR]:`, text);
        setOutput(prev => [...prev, `ERROR: ${text}`]);
      },
      onRuntimeInitialized: () => {
        console.log(`[${programId}] Emscripten runtime initialized.`);
        // Check if the component is still mounted and this specific script is still relevant
        const currentScriptInDom = document.getElementById(scriptId);
        if (currentScriptInDom === scriptElement) { 
          moduleRef.current = window.Module;
          setIsLoaded(true);
        } else {
          console.warn(`[${programId}] Runtime initialized, but script tag mismatch or component unmounted. Aborting setup for this instance.`);
        }
      },
      // Optional: setStatus can give insights into Emscripten's loading process
      // setStatus: (text: string) => {
      //   console.log(`[${programId} STATUS]:`, text);
      // },
    };
    
    console.log(`[${programId}] Appending new script tag: ${scriptId}, src: ${scriptPath}`);
    document.body.appendChild(scriptElement);
    const currentScriptElement = scriptElement; // Capture for cleanup

    return () => {
      console.log(`[${programId}] useEffect cleanup: Unmounting CProgramRunner for ${programName}.`);
      if (currentScriptElement && currentScriptElement.parentElement) {
        currentScriptElement.parentElement.removeChild(currentScriptElement);
        console.log(`[${programId}] Removed script tag ${scriptId} on unmount.`);
      }
      
      // If this specific module instance was assigned to window.Module, clear it.
      // This helps if another CProgramRunner instance for a *different* program loads next.
      if (window.Module === moduleRef.current) {
        // delete window.Module; // This might be too aggressive if HMR is involved or multiple instances are desired.
                               // Relying on the pre-load delete window.Module is generally safer.
        console.log(`[${programId}] window.Module was associated with this instance. It will be cleared on next load if needed.`);
      }
      
      moduleRef.current = null;
      setIsLoaded(false);
      setIsRunning(false);
    };
  }, [programName, scriptPath, programId]); // Key dependencies for re-running the effect

  // ... (rest of the component: getInitFunctionName, getProcessInputFunctionName, handleInitializeProgram, handleSendInput, return JSX) ...
  // No changes to the rest of the functions from the previous version are strictly needed for this specific error,
  // but ensure they use programId for logging as shown before.

  const getInitFunctionName = () => {
    return initFunctionNameOverride || `init_${programId}`;
  }

  const getProcessInputFunctionName = () => {
    if (programId === "minigame" && !processInputFunctionNameOverride) return "process_minigame_guess";
    return processInputFunctionNameOverride || `process_${programId}_input`;
  }

  const handleInitializeProgram = () => {
    const initFnName = getInitFunctionName(); // e.g., "init_minigame"
    const actualModuleFunctionName = '_' + initFnName; // e.g., "_init_minigame"

    if (isLoaded && moduleRef.current && typeof moduleRef.current.ccall === 'function') {
      setOutput([`--- Initializing ${programName} ---`]);
      try {
        // Check if the specific init function (with underscore) exists on the module object
        if (typeof moduleRef.current[actualModuleFunctionName] === 'function') {
          console.log(`[${programId}] Calling C function via ccall: ${initFnName}()`);
          // ccall takes the non-underscored name
          moduleRef.current.ccall(initFnName, 'void', [], []);
          setIsRunning(true);
        } else if (typeof moduleRef.current._main === 'function') { // Check for exported C main function
          console.log(`[${programId}] '${actualModuleFunctionName}' not found. '_main' function exists. Assuming it's handled by Emscripten runtime.`);
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
    const processFnName = getProcessInputFunctionName(); // e.g., "process_minigame_guess"
    const actualModuleProcessFnName = '_' + processFnName; // e.g., "_process_minigame_guess"

    if (isLoaded && moduleRef.current && typeof moduleRef.current.ccall === 'function' && inputValue) {
      setOutput(prev => [...prev, `> ${inputValue}`]);
      try {
        // Check if the specific process input function (with underscore) exists
        if (typeof moduleRef.current[actualModuleProcessFnName] === 'function') {
          console.log(`[${programId}] Calling C function via ccall: ${processFnName}("${inputValue}")`);
          // ccall takes the non-underscored name
          moduleRef.current.ccall(processFnName, 'void', ['string'], [inputValue]);
        } else {
          const msg = `[${programId}] Input handling function '${actualModuleProcessFnName}' not found on Module. Check export settings.`;
          console.warn(msg, moduleRef.current);
          setOutput(prev => [...prev, msg]);
        }
      } catch (e: any) {
        console.error(`[${programId}] Error sending input:`, e);
        setOutput(prev => [...prev, `Error sending input: ${e.message || String(e)}`]);
      }
      setInputValue('');
    } else if (!inputValue) {
      setOutput(prev => [...prev, "Please type an input before sending."]);
    } else {
      const msg = `[${programId}] Module not ready to process input. Loaded: ${isLoaded}, Running: ${isRunning}, Module: ${!!moduleRef.current}`;
      console.warn(msg);
      setOutput(prev => [...prev, msg]);
    }
  };

  return (
    <div style={{ border: '1px solid lightgray', padding: '1em', margin: '1em 0', backgroundColor: '#28282B', color: 'white' }}>
      <h4>{programName}</h4>
      
      {!isRunning && isLoaded && (
        <button 
          onClick={handleInitializeProgram} 
          disabled={!isLoaded} /* Could also add: || !moduleRef.current?.[getInitFunctionName()] && !moduleRef.current?.callMain */
          className="cprogram-runner-button"
        >
          Start
        </button>
      )}
      {isRunning && <p><strong>{programName} is active.</strong></p>}
      
      <p>
        Status: {isLoaded ? "Module Loaded" : "Loading module..."}
        {isRunning && ` - ${programName} in progress`}
      </p>
      
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
            disabled={!moduleRef.current?.['_' + getProcessInputFunctionName()]} // Check with underscore
          >
            Send Input
          </button>
        </div>
      )}

      <h5>Output:</h5>
      <pre style={{ backgroundColor: 'black', border: '1px solid #333', padding: '0.5em', minHeight: '100px', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {output.join('\n')}
      </pre>
      <p style={{fontSize: '0.8em', color: 'gray'}}>
        <strong>Note:</strong> Click &quot;Start&quot; first. Then enter your input.
      </p>
    </div>
  );
};

export default CProgramRunner;