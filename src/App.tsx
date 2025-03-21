import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { WorkflowProvider } from '@/lib/workflow';
import { Home } from '@/pages/home';
import { Dashboard } from '@/pages/dashboard';
import { Settings } from '@/pages/settings';
import { ScriptProcessing } from '@/pages/script-processing';
import { Storyboarding } from '@/pages/storyboarding';
import { MovieEditing } from '@/pages/movie-editing';
import { AudioIntegration } from '@/pages/audio-integration';
import { MovieAssembly } from '@/pages/movie-assembly';
import { Theatre } from '@/pages/theatre';

function App() {
  return (
    <WorkflowProvider>
      <Router>
        <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/script"
                element={
                  <ProtectedRoute>
                    <ScriptProcessing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/storyboard"
                element={
                  <ProtectedRoute>
                    <Storyboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/movie"
                element={
                  <ProtectedRoute>
                    <MovieEditing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audio"
                element={
                  <ProtectedRoute>
                    <AudioIntegration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assembly"
                element={
                  <ProtectedRoute>
                    <MovieAssembly />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/theatre"
                element={
                  <ProtectedRoute>
                    <Theatre />
                  </ProtectedRoute>
                }
              />
            </Routes>
        </Layout>
      </Router>
    </WorkflowProvider>
  );
}

export default App;
