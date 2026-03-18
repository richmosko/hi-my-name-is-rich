interface VideoProps {
  src: string;
  caption?: string;
  poster?: string;
}

export default function Video({ src, caption, poster }: VideoProps) {
  return (
    <figure className="my-4">
      <video
        src={poster ? src : `${src}#t=1`}
        controls
        className="w-full rounded-lg"
        preload="metadata"
        poster={poster}
      />
      {caption && (
        <figcaption className="text-sm text-content-muted text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
