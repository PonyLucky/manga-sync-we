import { useState } from 'react';
import { Manga } from '@/types';
import './MangaCard.scss';

interface MangaCardProps {
  manga: Manga;
  onClick?: () => void;
}

export function MangaCard({ manga, onClick }: MangaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <article className="manga-card" onClick={onClick}>
      <div className="manga-card__image-container">
        {!imageLoaded && !imageError && <div className="manga-card__skeleton" />}
        {imageError ? (
          <div className="manga-card__placeholder">
            <span>{manga.name.charAt(0).toUpperCase()}</span>
          </div>
        ) : (
          <img
            src={manga.cover_small || manga.cover}
            alt={manga.name}
            className={`manga-card__image ${imageLoaded ? 'manga-card__image--loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        <div className="manga-card__overlay">
          <span className="manga-card__view-text">View Details</span>
        </div>
      </div>
      <div className="manga-card__info">
        <h3 className="manga-card__title" title={manga.name}>
          {manga.name}
        </h3>
      </div>
    </article>
  );
}
