import { authors } from '../data/authors';
import { categoryConfig } from '../data/categories';
import type { Category } from '../types';

export default function About() {
  const author = authors['rich'];

  // Show all defined categories so new ones appear automatically
  const allCategories = Object.keys(categoryConfig) as Category[];

  return (
    <article className="flex flex-col gap-10 items-center">
      {/* Header — avatar + About Rich title, centered at 640px */}
      <header className="w-full max-w-[640px] flex items-center gap-4">
        {author && (
          <img
            src={author.avatar}
            alt={author.name}
            className="w-[48px] h-[48px] rounded-full object-cover"
          />
        )}
        <h2 className="text-3xl font-bold text-content leading-tight">
          About Rich
        </h2>
      </header>

      {/* Hero image — full 1250 width, 280px tall */}
      <div className="w-full h-[280px] rounded-xl overflow-hidden">
        <img
          src="/images/posts/northern-lights-snowy-mountains.jpg"
          alt="Northern lights over snowy mountains"
          className="w-full h-full object-cover"
        />
      </div>

      {/* About text — centered at 640px */}
      <div className="w-full max-w-[640px] flex flex-col gap-4 text-content-secondary leading-relaxed">
        <p>
          I am a retired{' '}
          <strong className="font-medium text-content">ASIC Design Engineer</strong>{' '}
          who worked on WiFi chipsets a
          million years ago. I've been{' '}
          <strong className="font-medium text-content">unemployed</strong>{' '}
          for a while now... so I'm not sure I could reenter the work force
          even if I wanted to.
        </p>
        <p>
          I have a ton of experience living the life of leisure though... and
          I've found that the{' '}
          <strong className="font-medium text-content">perfect work / life balance</strong>{' '}
          is to remove the work component altogether. This doesn't mean that I
          just sit around all day. Quite the contrary! I strive to{' '}
          <strong className="font-medium text-content">Stay Young</strong>.
          To stay active.{' '}
          <strong className="font-medium text-content">Stay Engaged</strong>.
          Never assuming that I've figured everything out. Keep Learning.{' '}
          <strong className="font-medium text-content">Stay Curious</strong>.
          Always keep an open mind and connect with people as often as possible.
        </p>
        <p>
          A small set of the things that bring me joy:
        </p>
        <ul className="list-disc list-inside space-y-1 text-content-secondary">
          <li>Snowboarding</li>
          <li>Mountain Biking</li>
          <li>Live Music</li>
          <li>Backpacking</li>
          <li>Travel</li>
          <li>Building Things</li>
          <li>Deviations from the Planned Course...</li>
        </ul>
      </div>

      {/* What's on my mind — category cards at 640px, left justified */}
      <section className="w-full max-w-[640px] flex flex-col gap-6">
        <h3 className="text-xl font-semibold text-content">
          What's on my mind...
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allCategories.map((cat) => {
            const config = categoryConfig[cat];
            return (
              <div
                key={cat}
                className={`p-5 rounded-xl border ${config.colors} transition-colors`}
              >
                <h4 className="text-sm font-semibold text-content mb-1">
                  {config.label}
                </h4>
                <p className="text-sm text-content-secondary">
                  {config.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}
