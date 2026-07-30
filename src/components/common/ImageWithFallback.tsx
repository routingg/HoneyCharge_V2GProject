import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  wrapperClassName?: string;
}

export function ImageWithFallback({ src, alt, className, wrapperClassName, ...rest }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex flex-col items-center justify-center gap-1 bg-[#EEF0F2] text-[#9AA0A6]',
          className,
          wrapperClassName
        )}
      >
        <ImageOff size={22} aria-hidden="true" />
        <span className="text-[11px]">이미지를 불러올 수 없어요</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
      {...rest}
    />
  );
}
