import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchPanel from './SearchOverlay';
import TopBar from './TopBar';
import Footer from './Footer';

export default function Layout() {
  const { pathname } = useLocation();
  const isConstellation = pathname === '/constellation';

  return (
    <div className={`min-h-screen flex flex-col bg-surface ${isConstellation ? 'overflow-hidden h-screen' : ''}`}>
      <Sidebar />
      <SearchPanel />
      <TopBar />
      <main className={`flex-1 w-full max-w-[1440px] px-5 sm:px-10 lg:px-[95px] ${isConstellation ? 'py-0' : 'py-8 sm:py-12'}`}>
        <Outlet />
      </main>
      {!isConstellation && <Footer />}
    </div>
  );
}
