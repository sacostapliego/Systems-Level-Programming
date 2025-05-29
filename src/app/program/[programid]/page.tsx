import { notFound } from 'next/navigation'; // For handling 404s
import ProgramClientPage from './program-client-page';

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
  grades: {
    id: 'grades',
    name: 'Grades Management System',
    scriptPath: '/grades.js',
    description: 'Manage student grades and calculate averages.',
    originalCodePath: '/grades.txt',
  }
};

export async function generateStaticParams() {
  return Object.keys(programMap).map((key) => ({
    programid: key,
  }));
}

interface PageProps {
  params: { programid: string };
  searchParams?: { [key: string]: string | string[] | undefined }; // Add this line
}

export default async function ProgramPage({ params }: PageProps) { // You can add searchParams here if needed
  const programId = params.programid;
  const program = programMap[programId] || null;

  if (!program) {
    notFound(); // Triggers a 404 page
  }

  // Pass the resolved programId and the program details to the client component
  return <ProgramClientPage programId={programId} initialProgram={program} />;
}