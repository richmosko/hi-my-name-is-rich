export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-edge">
      <div className="flex items-center h-16 px-6 pl-16">
        <h1 className="text-lg font-semibold text-content tracking-tight">
          Hi, My Name is Rich<span className="text-accent">...</span>
        </h1>
      </div>
    </header>
  );
}
