import MapView from '@/components/MapView';
import ErrorBoundary from '@/components/ErrorBoundary';

const Index = () => {
  return (
    <ErrorBoundary>
      <main className="w-full h-screen overflow-hidden">
        <MapView />
      </main>
    </ErrorBoundary>
  );
};

export default Index;
