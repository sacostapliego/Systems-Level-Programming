import Link from 'next/link';
import styles from './page.module.css'; // Assuming you have some styles

export default function Home() {
  const programs = [
    { id: 'inventory', name: 'Inventory Management System', description: 'Manage product inventory.' },
    { id: 'jukebox', name: 'Jukebox', description: 'Play song lyrics.' },
    { id: 'minigame', name: 'Minigame', description: 'Guess the secret code.' },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1>C Programs Showcase</h1>
        <p>Select a program to run:</p>
      </div>

      <div className={styles.grid}>
        {programs.map((program) => (
          <Link key={program.id} href={`/program/${program.id}`} className={styles.card}>
            <h2>{program.name} &rarr;</h2>
            <p>{program.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}