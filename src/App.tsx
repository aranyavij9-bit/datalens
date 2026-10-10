import { AppProvider } from '@/context/AppContext';
import { useRouter } from '@/context/router';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { DataPage } from '@/pages/DataPage';
import { VisualLabPage } from '@/pages/VisualLabPage';
import { RelationshipsPage } from '@/pages/RelationshipsPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { DecisionLabPage } from '@/pages/DecisionLabPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { StudentPage } from '@/pages/StudentPage';
import { AboutPage } from '@/pages/AboutPage';

function AppContent() {
  const { page, navigate } = useRouter();

  return (
    <Layout page={page} navigate={navigate}>
      <ErrorBoundary resetKey={page}>
      {page === 'home' && <HomePage navigate={navigate} />}
      {page === 'workspace' && <WorkspacePage navigate={navigate} />}
      {page === 'data' && <DataPage />}
      {page === 'visual' && <VisualLabPage />}
      {page === 'relationships' && <RelationshipsPage />}
      {page === 'analysis' && <AnalysisPage />}
      {page === 'decision' && <DecisionLabPage />}
      {page === 'insights' && <InsightsPage />}
      {page === 'reports' && <ReportsPage />}
      {page === 'student' && <StudentPage />}
      {page === 'about' && <AboutPage />}
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
