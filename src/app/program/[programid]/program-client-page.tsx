'use client';

import CProgramRunner from '@/app/components/CProgramRunner';
import Link from 'next/link';
import { useEffect, useState } from 'react';
// Removed useParams and useRouter as props will provide necessary data

interface ProgramDetails {
  id: string;
  name: string;
  scriptPath: string;
  description?: string;
  originalCodePath?: string;
  initFunctionNameOverride?: string;
  processInputFunctionNameOverride?: string;
}

interface ProgramClientPageProps {
  programId: string; // The resolved program ID
  initialProgram: ProgramDetails | null; // The program details fetched on the server
}

export default function ProgramClientPage({ programId, initialProgram }: ProgramClientPageProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const [program, setProgram] = useState<ProgramDetails | null>(initialProgram);
  const [activeTab, setActiveTab] = useState<'run' | 'code'>('run');
  const [originalCodeContent, setOriginalCodeContent] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);

  useEffect(() => {
    // Update client state if the initial program prop changes (e.g., client-side navigation)
    setProgram(initialProgram);
    setActiveTab('run');
    setOriginalCodeContent(null);
    setIsLoadingCode(false);
  }, [initialProgram]);

  useEffect(() => {
    if (activeTab === 'code' && program?.originalCodePath && !originalCodeContent) {
      setIsLoadingCode(true);
      fetch(`${basePath}${program.originalCodePath}`)
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
  }, [activeTab, program, originalCodeContent, basePath]); // Added program to dependencies

  if (!program) {
    return (
      <main style={{ padding: '2rem', color: 'white', backgroundColor: 'black', minHeight: '100vh' }}>
        <h1>Program Not Found</h1>
        <p>
          The program ID &quot;{programId}&quot; is not recognized.
        </p>
        {/* Link component automatically handles basePath */}
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
    minHeight: '350px',
  };

  return (
    <main style={{ padding: '2rem', backgroundColor: '#1e1e1e', color: 'white', minHeight: '100vh' }}>
      <Link href="/" style={{ color: 'lightblue', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Home
      </Link>
      <h1>{program.name}</h1>
      <p style={{ marginBottom: '1.5rem' }}>{program.description}</p>

      <div style={{ marginBottom: '0' }}>
        <button style={tabButtonStyle('run')} onClick={() => setActiveTab('run')}>
          Run Program
        </button>
        {program.originalCodePath && (
          <button style={tabButtonStyle('code')} onClick={() => setActiveTab('code')}>
            View Original Code
          </button>
        )}
      </div>

      {activeTab === 'run' && (
        <CProgramRunner
          key={program.id}
          programName={program.name}
          scriptPath={`${basePath}${program.scriptPath}`}
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