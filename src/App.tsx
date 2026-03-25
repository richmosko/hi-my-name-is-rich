import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ConstellationProvider } from './hooks/useConstellationControls';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import PostsList from './pages/PostsList';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail';
import PostDetail from './pages/PostDetail';
import Contributors from './pages/Contributors';
import Constellation from './pages/Constellation';
import Admin from './pages/Admin';
import Changelog from './pages/Changelog';
import { lazy, Suspense } from 'react';

// Lazy-load Keystatic to keep the main bundle small
const KeystaticAdmin = lazy(() => import('./pages/KeystaticAdmin'));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ConstellationProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contributors" element={<Contributors />} />
          <Route
            path="posts"
            element={<PostsList title="All Posts" />}
          />
          <Route
            path="travel"
            element={<PostsList title="Travel" category="travel" />}
          />
          <Route
            path="design"
            element={<PostsList title="Design" category="design" />}
          />
          <Route
            path="finance"
            element={<PostsList title="Finance" category="finance" />}
          />
          <Route
            path="projects"
            element={<ProjectsPage />}
          />
          <Route
            path="musings"
            element={<PostsList title="Musings" category="musings" />}
          />
          <Route
            path="cool-shit"
            element={<PostsList title="Cool Shit" category="cool-shit" />}
          />
          <Route
            path="food"
            element={<PostsList title="Food" category="food" />}
          />
          <Route path="constellation" element={<Constellation />} />
          <Route path="project/:id" element={<ProjectDetail />} />
          <Route path="post/:slug" element={<PostDetail />} />
          <Route path="admin" element={<Admin />} />
          <Route path="changelog" element={<Changelog />} />
        </Route>
        {/* Keystatic CMS — outside Layout (has its own UI chrome) */}
        <Route
          path="keystatic/*"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading editor...</div>}>
              <KeystaticAdmin />
            </Suspense>
          }
        />
      </Routes>
      </ConstellationProvider>
    </BrowserRouter>
  );
}
