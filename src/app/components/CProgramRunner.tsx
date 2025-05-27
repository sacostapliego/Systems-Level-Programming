'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEmscripten } from '../hooks/useEmscipten';

interface CProgramRunnerProps {
  programName: string;
  scriptPath: string;
  programId: string;
  initFunctionNameOverride?: string;
  processInputFunctionNameOverride?: string;
  // originalCodePath is no longer needed here
}

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
  // activeTab, originalCodeContent, isLoadingCode states are removed

  const { isLoaded, moduleRef, setIsLoaded } = useEmscripten({
    programName,
    scriptPath,
    programId,
    setOutput,
  });

  useEffect(() => {
    if (!isLoaded) {
      setIsRunning(false);
      // setOutput([]); // Consider if output should clear when module reloads/fails
    }
  }, [isLoaded]);

  // useEffect for fetching original code is removed

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
          moduleRef.current.callMain([]);
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

    if (!inputValue.trim()) {
      setOutput(prev => [...prev, "Please type an input before sending."]);
      return;
    }

    if (!isLoaded || !moduleRef.current || typeof moduleRef.current.ccall !== 'function') {
      const msg = `[${programId}] Module not ready to process input. Loaded: ${isLoaded}, Running: ${isRunning}, Module: ${!!moduleRef.current}`;
      console.warn(msg);
      setOutput(prev => [...prev, msg]);
      return;
    }

    setOutput(prev => [...prev, `> ${inputValue}`]);

    try {
      if (typeof moduleRef.current[actualModuleProcessFnName] === 'function') {
        const ccallOptions: { async?: boolean } = {};
        if (programId === "jukebox") {
            ccallOptions.async = true;
        }
        moduleRef.current.ccall(
            processFnName,
            'void',
            ['string'],
            [inputValue],
            ccallOptions
        );
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
  };

  // tabButtonStyle function is removed

  return (
    // The main div now directly contains the "run" program UI
    // The style is the same as the contentBoxStyle in page.tsx
    <div style={{ border: '1px solid lightgray', padding: '0.5em', margin: '0 0 1em 0', backgroundColor: '#28282B', color: 'white', borderRadius: '4px', minHeight: '350px' }}>
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
        style={{ backgroundColor: 'black', border: '1px solid #333', padding: '0.5em', minHeight: '300px', maxHeight: '600px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
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