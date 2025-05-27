import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

declare global {
  interface Window {
    Module?: any;
    ExitStatus?: any;
  }
}

interface UseEmscriptenProps {
  programName: string;
  scriptPath: string;
  programId: string;
  setOutput: Dispatch<SetStateAction<string[]>>;
}

interface UseEmscriptenReturn {
  isLoaded: boolean;
  moduleRef: React.RefObject<any | null>;
  setIsLoaded: Dispatch<SetStateAction<boolean>>;
}

export const useEmscripten = ({
  programName, // Display name, used for logging
  scriptPath,
  programId,   // Unique ID for script tag and logging
  setOutput,
}: UseEmscriptenProps): UseEmscriptenReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const moduleRef = useRef<any>(null);

  useEffect(() => {
    const scriptId = `emscripten-script-${programId}`;
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (scriptElement) {
      scriptElement.remove();
      scriptElement = null;
    }

    // Clean up window.Module (which might be a previous factory or instance)
    if (typeof window.Module !== 'undefined') {
      if (window.Module && typeof window.Module.exit === 'function') {
        try {
          window.Module.exit();
        } catch (e) {
          console.warn(`[${programId}] PRE-LOAD: Error calling exit on old Module:`, e);
        }
      }
      try {
        delete window.Module;
        window.Module = undefined;
      } catch (e) {
        console.warn(`[${programId}] PRE-LOAD: Error deleting/undefining window.Module:`, e);
      }
    }

    // Clean up window.ExitStatus
    if (typeof window.ExitStatus !== 'undefined') {
      try {
        delete window.ExitStatus;
        window.ExitStatus = undefined;
      } catch (e) {
        console.warn(`[${programId}] PRE-LOAD: Error deleting/undefining window.ExitStatus:`, e);
      }
    }

    setIsLoaded(false);
    moduleRef.current = null;

    // --- SCRIPT LOADING ---
    scriptElement = document.createElement('script');
    scriptElement.id = scriptId;
    scriptElement.src = scriptPath;
    scriptElement.async = true;
    // scriptElement.type = 'text/javascript'; // Not strictly necessary

    scriptElement.onload = () => {
      // With -sMODULARIZE=1 and default -sEXPORT_NAME="Module" (or if output is Module.js),
      // or if the script is like your minigame.js (var Module = (()=>{...})()),
      // window.Module will be the factory function.
      if (typeof window.Module === 'function') {
        const emscriptenFactory = window.Module;
        
        const moduleConfig = {
          print: (text: string) => {
            setOutput(prev => [...prev, text]);
          },
          printErr: (text: string) => {
            console.error(`[${programId} STDERR]:`, text);
            setOutput(prev => [...prev, `ERROR: ${text}`]);
          },
          locateFile: (path: string, scriptDirectoryPath: string) => {
            const actualScriptDir = scriptPath.substring(0, scriptPath.lastIndexOf('/') + 1);
            return actualScriptDir + path;
          },
          // onRuntimeInitialized can be part of the config.
          // The Emscripten module will call this once it's ready internally.
          onRuntimeInitialized: () => {
            // The module instance is already available via the promise resolution.
            // This callback is more for internal Emscripten setup.
          }
        };

        emscriptenFactory(moduleConfig)
          .then((initializedModule: any) => {
            const currentScriptInDom = document.getElementById(scriptId);
            // Ensure the script that loaded is still the one we intended to manage
            if (currentScriptInDom === scriptElement) {
              moduleRef.current = initializedModule;
              setIsLoaded(true);
            } else {
              console.warn(`[${programId}] Emscripten factory resolved, but script tag mismatch or no longer in DOM. Not setting module.`);
              if (initializedModule && typeof initializedModule.exit === 'function') {
                try { initializedModule.exit(); } catch(e) { /* ignore */ }
              }
            }
          })
          .catch((error: any) => {
            console.error(`[${programId}] Error during Emscripten module instantiation via factory:`, error);
            setOutput(prev => [...prev, `FATAL ERROR: Instantiation failed for ${scriptPath}. ${error.message || String(error)}`]);
            setIsLoaded(false);
          });
      } else {
        console.error(`[${programId}] Emscripten factory function (window.Module) not found after script ${scriptPath} loaded.`);
        setOutput(prev => [...prev, `FATAL ERROR: Emscripten module factory not found for ${scriptPath}. Ensure it's compiled with -sMODULARIZE=1.`]);
        setIsLoaded(false);
      }
    };

    scriptElement.onerror = (event: Event | string) => {
      console.error(`[${programId}] SCRIPT LOAD ERROR: Failed to load script: ${scriptPath}. Event:`, event);
      setOutput(prev => [...prev, `FATAL ERROR: Failed to load script ${scriptPath}. Check console and network tab.`]);
      setIsLoaded(false);
      // Clean up the failed script tag
      if (scriptElement && scriptElement.parentElement) {
        scriptElement.parentElement.removeChild(scriptElement);
      }
      // Attempt to clean up window.Module if it was somehow set
      if (window.Module) {
        try {
          delete window.Module;
          window.Module = undefined;
        } catch(e) { /* ignore */ }
      }
    };

    document.body.appendChild(scriptElement);
    const currentScriptElementForCleanup = scriptElement; // Capture for cleanup

    // --- EFFECT CLEANUP FUNCTION ---
    return () => {
      if (currentScriptElementForCleanup && currentScriptElementForCleanup.parentElement) {
        currentScriptElementForCleanup.parentElement.removeChild(currentScriptElementForCleanup);
      }

      // If the module instance was created and has an exit method, call it.
      if (moduleRef.current && typeof moduleRef.current.exit === 'function') {
        try {
          moduleRef.current.exit();
        } catch (e) {
          console.warn(`[${programId}] EFFECT CLEANUP: Error calling exit() on module instance:`, e);
        }
      }
      
      // Clean up window.Module (which could be the factory from the script we just removed)
      if (typeof window.Module !== 'undefined') {
        try {
          delete window.Module;
          window.Module = undefined;
        } catch (e) { console.warn(`[${programId}] EFFECT CLEANUP: Error deleting/undefining window.Module:`, e); }
      }

      if (typeof window.ExitStatus !== 'undefined') {
        console.warn(`[${programId}] EFFECT CLEANUP: Cleaning up window.ExitStatus.`);
        try {
          delete window.ExitStatus;
          window.ExitStatus = undefined;
        } catch (e) {
          console.warn(`[${programId}] EFFECT CLEANUP: Error deleting/undefining window.ExitStatus:`, e);
        }
      }
      
      moduleRef.current = null;
      // setIsLoaded(false); // Already handled by the main effect body when scriptPath changes
    };
  }, [programName, scriptPath, programId, setOutput]); // Removed setIsLoaded from deps as it's stable

  return { isLoaded, moduleRef, setIsLoaded };
};