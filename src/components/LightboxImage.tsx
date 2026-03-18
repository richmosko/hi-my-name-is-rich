import { useState } from 'react';
import Lightbox from './Lightbox';

export default function LightboxImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);
  const { src, alt, ...rest } = props;
  if (!src) return <img {...props} />;
  return (
    <>
      <img
        src={src}
        alt={alt}
        className="cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
        onClick={() => setOpen(true)}
        {...rest}
      />
      {open && (
        <Lightbox
          images={[{ src, alt: alt || '', caption: alt || '' }]}
          currentIndex={0}
          onClose={() => setOpen(false)}
          onPrev={() => {}}
          onNext={() => {}}
        />
      )}
    </>
  );
}
