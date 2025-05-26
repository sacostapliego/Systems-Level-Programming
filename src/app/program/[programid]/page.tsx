'use client';

import CProgramRunner from '@/app/components/CProgramRunner'; // Ensure this path is correct
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProgramDetails {
  id: string;
  name: string;
  scriptPath: string;
  description?: string;
}

const programMap: Record<string, ProgramDetails> = {
  inventory: {
    id: 'inventory',
    name: 'Inventory Management System',
    scriptPath: '/inventory.js',
    description: 'An interactive inventory management system.',
  },
  jukebox: {
    id: 'jukebox',
    name: 'Jukebox',
    scriptPath: '/jukebox.js',
    description: 'Select a song to see its lyrics.',
  },
  minigame: {
    id: 'minigame',
    name: 'Code Guessing Minigame',
    scriptPath: '/minigame.js',
    description: 'Try to guess the 3-digit secret code.',
  },
};

export default function ProgramPage() {
  const params = useParams();
  // Initialize program state to undefined to signify loading
  const [program, setProgram] = useState<ProgramDetails | null | undefined>(undefined);
  // Store the programId string that was actually used for the lookup
  const [resolvedProgramId, setResolvedProgramId] = useState<string | null>(null);

  useEffect(() => {
    let idFromParams: string | null = null;

    // Use params.programid (all lowercase) to match your folder structure
    if (typeof params.programid === 'string') {
      idFromParams = params.programid;
    } else if (Array.isArray(params.programid) && params.programid.length > 0 && typeof params.programid[0] === 'string') {
      // Handle cases where programId might be an array (though less common for simple routes)
      idFromParams = params.programid[0];
    }
    
    setResolvedProgramId(idFromParams);

    if (idFromParams && programMap[idFromParams]) {
      setProgram(programMap[idFromParams]);
    } else {
      // If idFromParams is null or not in map, set program to null (not found)
      setProgram(null);
    }
  }, [params.programid]); // Re-run effect if params.programid changes

  // Loading state
  if (program === undefined) {
    return (
      <main style={{ padding: '2rem', color: 'white', backgroundColor: 'black', minHeight: '100vh' }}>
        <h1>Loading program details...</h1>
        {/* Use params.programid here as well for consistency in logging/display */}
        <p>Fetching details for program ID: {Array.isArray(params.programid) ? params.programid.join(', ') : params.programid || 'N/A'}</p>
        <Link href="/" style={{ color: 'lightblue' }}>Go back to Home</Link>
      </main>
    );
  }

  // Not found state
  if (!program) {
    return (
      <main style={{ padding: '2rem', color: 'white', backgroundColor: 'black', minHeight: '100vh' }}>
        <h1>Program Not Found</h1>
        <p>
          {/* Use params.programid here as well */}
          The program ID &quot;{resolvedProgramId || (Array.isArray(params.programid) ? params.programid.join(', ') : params.programid) || 'unknown'}&quot; is not recognized.
        </p>
        <Link href="/" style={{ color: 'lightblue' }}>Go back to Home</Link>
      </main>
    );
  }
  
  if (!program || !resolvedProgramId) { // Added check for resolvedProgramId
    // ... return loading or not found ...
    return (
      <main style={{ padding: '2rem', color: 'white', backgroundColor: 'black', minHeight: '100vh' }}>
        <h1>{program === undefined ? "Loading program details..." : "Program Not Found"}</h1>
        <p>
          {program === undefined 
            ? `Fetching details for program ID: ${Array.isArray(params.programid) ? params.programid.join(', ') : params.programid || 'N/A'}`
            : `The program ID "${resolvedProgramId || (Array.isArray(params.programid) ? params.programid.join(', ') : params.programid) || 'unknown'}" is not recognized.`}
        </p>
        <Link href="/" style={{ color: 'lightblue' }}>Go back to Home</Link>
      </main>
    );
  }


  // Program found and loaded
  return (
    <main style={{ padding: '2rem', backgroundColor: '#1e1e1e', color: 'white', minHeight: '100vh' }}>
      <Link href="/" style={{ color: 'lightblue', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Home
      </Link>
      <h1>{program.name}</h1>
      <p style={{ marginBottom: '1.5rem' }}>{program.description}</p>
      <CProgramRunner
        key={program.id} // Key helps React identify the component instance
        programName={program.name}
        scriptPath={program.scriptPath}
        programId={program.id}
      />
    </main>
  );
}