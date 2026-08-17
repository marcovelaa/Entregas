import { Suspense } from 'react';
import MarcasPanel from '../components/MarcasPanel';

export default function MarcasPage() {
  return (
    <Suspense fallback={null}>
      <MarcasPanel />
    </Suspense>
  );
}
