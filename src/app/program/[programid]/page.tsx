'use client';

import CProgramRunner from '@/app/components/CProgramRunner'; 
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProgramDetails {
  id: string;
  name: string;
  scriptPath: string;
  description?: string;
  originalCodePath?: string;
  initFunctionNameOverride?: string;
  processInputFunctionNameOverride?: string;
}

const programMap: Record<string, ProgramDetails> = {
  inventory: {
    id: 'inventory',
    name: 'Inventory Management System',
    scriptPath: '/inventory.js',
    description: 'An interactive inventory management system.',
    originalCodePath: '/inventory.txt',
  },
  jukebox: {
    id: 'jukebox',
    name: 'Jukebox',
    scriptPath: '/jukebox.js',
    description: 'Select a song to see its lyrics.',
    originalCodePath: '/jukebox.txt',
  },
  minigame: {
    id: 'minigame',
    name: 'Code Guessing Minigame',
    scriptPath: '/minigame.js',
    description: 'Try to guess the 3-digit secret code.',
    originalCodePath: '/minigame.txt',
  },
};

export default function ProgramPage() {
  const params = useParams();
  const [program, setProgram] = useState<ProgramDetails | null | undefined>(undefined);
  const [resolvedProgramId, setResolvedProgramId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'run' | 'code'>('run');
  const [originalCodeContent, setOriginalCodeContent] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);

  useEffect(() => {
    let idFromParams: string | null = null;
    if (typeof params.programid === 'string') {
      idFromParams = params.programid;
    } else if (Array.isArray(params.programid) && params.programid.length > 0 && typeof params.programid[0] === 'string') {
      idFromParams = params.programid[0];
    }
    setResolvedProgramId(idFromParams);

    if (idFromParams && programMap[idFromParams]) {
      setProgram(programMap[idFromParams]);
      // Reset tab state when program changes
      setActiveTab('run');
      setOriginalCodeContent(null);
      setIsLoadingCode(false);
    } else {
      setProgram(null);
    }
  }, [params.programid]);

  useEffect(() => {
    if (activeTab === 'code' && program?.originalCodePath && !originalCodeContent) {
      setIsLoadingCode(true);
      fetch(program.originalCodePath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch code: ${response.statusText}`);
          }
          return response.text();
        })
        .then(text => {
          setOriginalCodeContent(text);
          setIsLoadingCode(false);
        })
        .catch(error => {
          console.error("Error fetching original code:", error);
          setOriginalCodeContent(`Error loading code: ${error.message}`);
          setIsLoadingCode(false);
        });
    }
  }, [activeTab, program?.originalCodePath, originalCodeContent, program]);

  // Loading state
  if (program === undefined) {
    return (
      <main style={{ padding: '2rem', color: 'white', backgroundColor: 'black', minHeight: '100vh' }}>
        <h1>Loading program details...</h1>
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
          The program ID &quot;{resolvedProgramId || (Array.isArray(params.programid) ? params.programid.join(', ') : params.programid) || 'unknown'}&quot; is not recognized.
        </p>
        <Link href="/" style={{ color: 'lightblue' }}>Go back to Home</Link>
      </main>
    );
  }

  const tabButtonStyle = (tabName: 'run' | 'code') => ({
    padding: '10px 15px',
    cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#28282B' : '#101011',
    color: 'white',
    marginRight: '5px',
    borderRadius: '4px 4px 0 0',
    borderColor: activeTab === tabName ? 'lightgray' : 'transparent',
    borderWidth: '1px',
    borderStyle: 'solid',
  });

  const contentBoxStyle = {
    border: '1px solid lightgray',
    padding: '0.5em',
    margin: '0 0 1em 0',
    backgroundColor: '#28282B',
    color: 'white',
    borderRadius: '0 0 4px 4px',
    minHeight: '350px', // Ensure consistent height for the content area
  };

  return (
    <main style={{ padding: '2rem', backgroundColor: '#1e1e1e', color: 'white', minHeight: '100vh' }}>
      <Link href="/" style={{ color: 'lightblue', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Home
      </Link>
      <h1>{program.name}</h1>
      <p style={{ marginBottom: '1.5rem' }}>{program.description}</p>

      {/* Tab Buttons */}
      <div style={{ marginBottom: '0' /* Adjusted to bring content box closer to tabs if desired, or keep 1em */ }}>
        <button style={tabButtonStyle('run')} onClick={() => setActiveTab('run')}>
          Run Program
        </button>
        {program.originalCodePath && (
          <button style={tabButtonStyle('code')} onClick={() => setActiveTab('code')}>
            View Original Code
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'run' && (
        <CProgramRunner
          key={program.id}
          programName={program.name}
          scriptPath={program.scriptPath}
          programId={program.id}
          initFunctionNameOverride={program.initFunctionNameOverride}
          processInputFunctionNameOverride={program.processInputFunctionNameOverride}
        />
      )}
      {activeTab === 'code' && program.originalCodePath && (
        <div style={contentBoxStyle}>
          <h5>Original C Code: {program.originalCodePath ? `(${program.originalCodePath.split('/').pop()})` : ''}</h5>
          {isLoadingCode && <p>Loading code...</p>}
          {originalCodeContent && !isLoadingCode && (
            <pre
              style={{ backgroundColor: 'black', border: '1px solid #333', padding: '0.5em', minHeight: '300px', maxHeight: '600px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#d4d4d4' }}
            >
              {originalCodeContent}
            </pre>
          )}
          {!originalCodeContent && !isLoadingCode && <p>No code path provided or code could not be loaded.</p>}
        </div>
      )}
    </main>
  );
}