import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import PostsList from './pages/PostsList';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail';
import PostDetail from './pages/PostDetail';
import Contributors from './pages/Contributors';
import Constellation from './pages/Constellation';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
