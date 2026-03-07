import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostsList from './pages/PostsList';
import PostDetail from './pages/PostDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
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
            path="goals"
            element={<PostsList title="Goals" category="goals" />}
          />
          <Route path="post/:slug" element={<PostDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
