import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Sidebar />
      <TopBar />
      <main className="flex-1 w-full max-w-[1440px] px-5 sm:px-10 lg:px-[95px] py-8 sm:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
