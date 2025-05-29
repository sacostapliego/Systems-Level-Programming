import Link from 'next/link';
import styles from './page.module.css'; // Assuming you have some styles

export default function Home() {
  const programs = [
    { id: 'jukebox', name: 'Jukebox', description: 'Play song lyrics. | Homework 1' },
    { id: 'inventory', name: 'Inventory Management System', description: 'Manage product inventory. | Homework 2' },
    { id: 'minigame', name: 'Minigame', description: 'Guess the secret code. | Homework 3' },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1>System Level Programming</h1>
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