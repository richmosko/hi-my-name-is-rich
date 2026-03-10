import { Link } from 'react-router-dom';
import { posts } from '../lib/posts';
import PostCard from '../components/PostCard';

export default function Home() {
  const latestPosts = posts.slice(0, 4);

  return (
    <div className="flex flex-col gap-16">
      {/* Hero section */}
      <section className="flex items-start gap-10">
        {/* Text — left side */}
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl font-bold text-content leading-tight">
            Hi, my name is Rich.
          </h1>
          <p className="text-xl font-light text-content-secondary leading-relaxed">
            Former <span className="text-2xl font-normal">Hardware Designer</span>,
            part-time <span className="text-2xl font-normal">Adventurer</span>,
            and full-time <span className="text-2xl font-normal">Loafer</span> and{' '}
            <span className="text-2xl font-normal">Fudgel</span>. This is a place
            for me to share what I'm learning, making, and thinking about.
          </p>
          <p className="text-xl font-light text-content-secondary leading-relaxed">
            I am by no means an expert... at pretty much anything. But I am a
            naturally <span className="text-2xl font-normal">curious</span>, and
            find myself with a lot of time to ponder and learn the meaning of
            things around me. This project is meant to be a{' '}
            <span className="text-2xl font-normal">learning</span> and{' '}
            <span className="text-2xl font-normal">growing</span> experience for
            me. It's pretty much not useful to anyone whatsoever 😂... but if
            you've stumbled here by accident:{' '}
            <span className="text-2xl font-semibold">Welcome Friend!</span>{' '}
            Hopefully I'm able to share a bit of positivity and joy.
          </p>
          <div className="pt-2">
            <Link
              to="/about"
              className="text-sm font-medium text-[#A0A0A0] hover:text-[#202020] transition-colors duration-150"
            >
              More about me &rarr;
            </Link>
          </div>
        </div>

        {/* Profile image — right side, fixed width per Figma */}
        <div className="w-[40%] max-w-[414px]">
          <img
            src="/profile.jpeg"
            alt="Rich Mosko"
            className="w-full aspect-square rounded-2xl object-cover shadow-sm"
          />
        </div>
      </section>

      {/* Latest Posts grid */}
      <section className="flex flex-col gap-10">
        <h2 className="text-3xl font-semibold text-content text-center">
          Latest Posts
        </h2>
        <div className="grid grid-cols-2 gap-x-14 gap-y-12">
          {latestPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
