interface YouTubeProps {
  id: string;
  title?: string;
}

export default function YouTube({ id, title = 'YouTube video' }: YouTubeProps) {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-surface-secondary my-4">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
