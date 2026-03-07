export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      {/* About section */}
      <section className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-content leading-tight">
          About
        </h2>
        <div className="flex flex-col gap-4 text-content-secondary leading-relaxed">
          <p>
            Welcome to my corner of the internet. I'm Rich — a curious mind
            fascinated by design, technology, travel, and the intersection of
            all three.
          </p>
          <p>
            This site is a living collection of my thoughts, adventures, and
            projects. Think of it as a digital garden — some ideas are fully
            formed essays, others are seedlings still taking shape. I write
            about the things I'm learning, the places I'm exploring, and the
            goals I'm chasing.
          </p>
          <p>
            Whether it's dissecting a design system, documenting a hike
            through the mountains, or reflecting on personal growth, you'll
            find it here. Pull up a chair and stay awhile.
          </p>
        </div>
      </section>

      {/* What you'll find here */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xl font-semibold text-content">
          What you'll find here
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Posts',
              desc: 'Long-form writing on technology, productivity, and life.',
              color: 'bg-accent/10 border-accent/20',
            },
            {
              title: 'Travel',
              desc: 'Stories and photos from places near and far.',
              color: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              title: 'Design',
              desc: 'Thoughts on visual design, systems, and craft.',
              color: 'bg-purple-500/10 border-purple-500/20',
            },
            {
              title: 'Goals',
              desc: 'Reflections on personal growth and ambition.',
              color: 'bg-amber-500/10 border-amber-500/20',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`p-5 rounded-xl border ${item.color} transition-colors`}
            >
              <h4 className="text-sm font-semibold text-content mb-1">
                {item.title}
              </h4>
              <p className="text-sm text-content-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder for future mind-map / background image */}
      <section className="flex flex-col gap-4">
        <div className="rounded-xl border border-dashed border-edge bg-surface-secondary/50 p-12 text-center">
          <p className="text-content-muted text-sm">
            Visual mind-map &amp; background image coming soon...
          </p>
        </div>
      </section>
    </div>
  );
}
