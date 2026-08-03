import Hero from '@/components/organisms/Hero/Hero';
import LevelsGrid from '@/components/organisms/LevelsGrid/LevelsGrid';
import RecommendedProducts from '@/components/organisms/RecommendedProducts/RecommendedProducts';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <Hero />
        <LevelsGrid />
        <RecommendedProducts />
      </main>
    </div>
  );
}
