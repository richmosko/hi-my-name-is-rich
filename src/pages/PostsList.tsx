import { posts } from '../data/posts';
import PostCard from '../components/PostCard';
import type { Category } from '../types';

interface PostsListProps {
  category?: Category;
  title: string;
}

export default function PostsList({ category, title }: PostsListProps) {
  const filteredPosts = category
    ? posts.filter((p) => p.categories.includes(category))
    : posts;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold text-content">{title}</h2>
        <p className="text-content-secondary mt-2 text-sm">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-16">
            <p className="text-content-muted">No posts yet in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
