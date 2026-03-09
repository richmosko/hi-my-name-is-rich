import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Sidebar />
      <TopBar />
      <main className="flex-1 w-full max-w-[1440px] pl-[95px] pr-[95px] py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
