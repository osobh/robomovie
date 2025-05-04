import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import { WorkflowProvider } from "@/lib/workflow";
import { Home } from "@/pages/home";
import { Dashboard } from "@/pages/dashboard";
import { Settings } from "@/pages/settings";
import { GenerateScript } from "@/pages/generate-script";
import { Storyboarding } from "@/pages/storyboarding";
import { MovieEditing } from "@/pages/movie-editing";
import { Theatre } from "@/pages/theatre";

function App() {
  return (
    <WorkflowProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/script" element={<GenerateScript />} />
            <Route path="/storyboard" element={<Storyboarding />} />
            <Route path="/movie" element={<MovieEditing />} />
            <Route path="/theatre" element={<Theatre />} />
          </Routes>
        </Layout>
      </Router>
    </WorkflowProvider>
  );
}

export default App;
