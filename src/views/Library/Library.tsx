import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Plus } from 'lucide-react';
import { useApi, useToast } from '@/context';
import { MangaCard, MangaCardSkeleton, Input, Header, Button } from '@/components';
import { AddMangaModal } from '@/views/AddManga/AddMangaModal';
import { Manga } from '@/types';
import './Library.scss';

export function Library() {
  const navigate = useNavigate();
  const { api, isConfigured, isLoading: isApiLoading } = useApi();
  const { showToast } = useToast();

  const [manga, setManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchManga = async () => {
    if (!api) return;

    setIsLoading(true);
    try {
      const response = await api.getAllManga();
      if (response.status === 'success' && response.data) {
        setManga(response.data);
      } else {
        showToast(response.message || 'Failed to fetch manga', 'error');
      }
    } catch {
      showToast('Failed to fetch manga', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isApiLoading) return;

    if (!isConfigured) {
      navigate('/settings');
      return;
    }

    fetchManga();
  }, [api, isConfigured, isApiLoading, navigate]);

  const filteredManga = useMemo(() => {
    if (!searchQuery.trim()) return manga;

    const query = searchQuery.toLowerCase();
    return manga.filter((m) => m.name.toLowerCase().includes(query));
  }, [manga, searchQuery]);

  const handleMangaClick = (id: number) => {
    navigate(`/manga/${id}`);
  };

  const handleMangaAdded = () => {
    setIsAddModalOpen(false);
    fetchManga();
  };

  if (isApiLoading) {
    return (
      <div className="library">
        <Header />
        <main className="library__content">
          <div className="library__header">
            <h1 className="library__title">My Library</h1>
          </div>
          <div className="library__grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <MangaCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isConfigured) {
    return null;
  }

  return (
    <div className="library">
      <Header />

      <main className="library__content">
        <div className="library__header">
          <div className="library__title-row">
            <h1 className="library__title">My Library</h1>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="library__add-btn library__add-btn--mobile"
            >
              <Plus size={18} />
            </Button>
          </div>
          <div className="library__actions">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="library__add-btn library__add-btn--desktop"
            >
              <Plus size={18} /> Add Manga
            </Button>
            <div className="library__search">
              <Input
                placeholder="Search manga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="library__grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <MangaCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredManga.length === 0 ? (
          <div className="library__empty">
            <AlertCircle size={48} />
            <h2>No manga found</h2>
            <p>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Add some manga to get started'}
            </p>
          </div>
        ) : (
          <div className="library__grid">
            {filteredManga.map((m) => (
              <MangaCard key={m.id} manga={m} onClick={() => handleMangaClick(m.id)} />
            ))}
          </div>
        )}
      </main>

      <AddMangaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleMangaAdded}
      />
    </div>
  );
}
