import './Skeleton.scss';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <div className={`skeleton skeleton--${variant} ${className}`} style={style} />;
}

export function MangaCardSkeleton() {
  return (
    <div className="manga-card-skeleton">
      <div className="manga-card-skeleton__image" />
      <div className="manga-card-skeleton__info">
        <div className="manga-card-skeleton__title" />
      </div>
    </div>
  );
}
