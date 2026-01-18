import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
  Globe,
  BookOpen,
  ChevronUp,
} from 'lucide-react';
import { useApi, useToast } from '@/context';
import { Button, Header, Modal, Input, Skeleton } from '@/components';
import { MangaDetails as MangaDetailsType, Source, Chapter, Website } from '@/types';
import './MangaDetails.scss';

export function MangaDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { api, isConfigured, isLoading: isApiLoading } = useApi();
  const { showToast } = useToast();

  const [manga, setManga] = useState<MangaDetailsType | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [history, setHistory] = useState<Chapter[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newSource, setNewSource] = useState({ websiteId: '', path: '' });
  const [isAddingSource, setIsAddingSource] = useState(false);

  const fetchMangaData = async () => {
    if (!api || !id) return;

    setIsLoading(true);
    try {
      const [mangaRes, sourcesRes, historyRes, websitesRes] = await Promise.all([
        api.getManga(Number(id)),
        api.getMangaSources(Number(id)),
        api.getMangaHistory(Number(id)),
        api.getAllWebsites(),
      ]);

      if (mangaRes.status === 'success' && mangaRes.data) {
        setManga(mangaRes.data);
      } else {
        showToast('Manga not found', 'error');
        navigate('/');
        return;
      }

      if (sourcesRes.status === 'success' && sourcesRes.data) {
        setSources(sourcesRes.data);
        if (sourcesRes.data.length > 0) {
          // @ts-ignore
          setSelectedSourceId((prev) => prev ?? sourcesRes.data[0].id);
        }
      }

      if (historyRes.status === 'success' && historyRes.data) {
        setHistory(historyRes.data);
      }

      if (websitesRes.status === 'success' && websitesRes.data) {
        setWebsites(websitesRes.data);
      }
    } catch {
      showToast('Failed to load manga details', 'error');
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

    fetchMangaData();
  }, [api, id, isConfigured, isApiLoading, navigate]);

  const handleDelete = async () => {
    if (!api || !id) return;

    setIsDeleting(true);
    try {
      const response = await api.deleteManga(Number(id));
      if (response.status === 'success') {
        showToast('Manga deleted successfully', 'success');
        navigate('/');
      } else {
        showToast(response.message || 'Failed to delete manga', 'error');
      }
    } catch {
      showToast('Failed to delete manga', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddSource = async () => {
    if (!api || !id || !newSource.websiteId || !newSource.path) return;

    setIsAddingSource(true);
    try {
      const response = await api.createSource(Number(id), {
        website_id: Number(newSource.websiteId),
        path: newSource.path,
      });

      if (response.status === 'success') {
        showToast('Source added successfully', 'success');
        setNewSource({ websiteId: '', path: '' });
        setIsAddSourceModalOpen(false);
        fetchMangaData();
      } else {
        showToast(response.message || 'Failed to add source', 'error');
      }
    } catch {
      showToast('Failed to add source', 'error');
    } finally {
      setIsAddingSource(false);
    }
  };

  if (isApiLoading) {
    return (
      <div className="manga-details">
        <Header />
        <main className="manga-details__content">
          <Skeleton height={400} />
        </main>
      </div>
    );
  }

  if (!isConfigured) {
    return null;
  }

  const handleContinueReading = () => {
    if (history.length === 0 || !selectedSourceId) return;

    const latestChapter = history[0];
    const source = sources.find((s) => s.id === selectedSourceId);
    if (!source) return;

    const domain = getWebsiteDomain(source.website_id);
    const url = `https://${domain}${source.path.replace(/\/$/, '')}/${latestChapter.number}`;
    window.open(url, '_blank');
  };

  const handleDeleteSource = async (source: Source) => {
    if (!api || !id) return;

    const domain = getWebsiteDomain(source.website_id);
    try {
      const response = await api.deleteSource(Number(id), domain);
      if (response.status === 'success') {
        showToast('Source deleted', 'success');
        const newSources = sources.filter((s) => s.id !== source.id);
        setSources(newSources);
        if (selectedSourceId === source.id) {
          setSelectedSourceId(newSources.length > 0 ? newSources[0].id : null);
        }
      } else {
        showToast(response.message || 'Failed to delete source', 'error');
      }
    } catch {
      showToast('Failed to delete source', 'error');
    }
  };

  const getWebsiteDomain = (websiteId: number) => {
    const website = websites.find((w) => w.id === websiteId);
    return website?.domain || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const cleanChapterNumber = (chapterNumber: string) => {
    return chapterNumber.replace('chapter-', '');
  }

  if (isLoading) {
    return (
      <div className="manga-details">
        <Header />
        <main className="manga-details__content">
          <div className="manga-details__skeleton">
            <Skeleton variant="rectangular" width={300} height={450} />
            <div className="manga-details__skeleton-info">
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="rectangular" width="100%" height={200} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!manga) {
    return null;
  }

  return (
    <div className="manga-details">
      <Header />

      <main className="manga-details__content">
        <button className="manga-details__back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </button>

        <div className="manga-details__main">
          <div className="manga-details__cover-container">
            <img
              src={manga.cover}
              alt={manga.name}
              className="manga-details__cover"
            />
            {manga.number_unread_chapter != null && manga.number_unread_chapter > 0 && (
              <div className="manga-details__unread-badge">
                {manga.number_unread_chapter > 99 ? '99+' : manga.number_unread_chapter} unread
              </div>
            )}
          </div>

          <div className="manga-details__info">
            <h1 className="manga-details__title">{manga.name}</h1>

            <div className="manga-details__actions">
              {history.length > 0 && sources.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleContinueReading}
                >
                  <BookOpen size={16} />
                  Continue Reading
                  <div className="manga-details__source-selector">
                    <ChevronUp size={14} />
                    <select
                      value={selectedSourceId || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedSourceId(Number(e.target.value));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="manga-details__source-select"
                    >
                      {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {getWebsiteDomain(source.website_id)}
                        </option>
                      ))}
                    </select>
                  </div>
                </Button>
              )}
            </div>

            <section className="manga-details__section">
              <div className="manga-details__section-header">
                <h2>
                  <Globe size={18} />
                  Sources
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddSourceModalOpen(true)}
                >
                  <Plus size={16} />
                  Add Source
                </Button>
              </div>

              {sources.length === 0 ? (
                <p className="manga-details__empty">No sources added yet</p>
              ) : (
                <ul className="manga-details__sources">
                  {sources.map((source) => (
                    <li key={source.id} className="manga-details__source">
                      <div className="manga-details__source-info">
                        <div className="manga-details__source-header">
                          <span className="manga-details__source-domain">
                            {getWebsiteDomain(source.website_id)}
                          </span>
                          {source.number_unread_chapter != null && source.number_unread_chapter > 0 && (
                            <span className="manga-details__source-unread">
                              {source.number_unread_chapter} unread
                            </span>
                          )}
                        </div>
                        <span className="manga-details__source-path">
                          {source.path}
                        </span>
                      </div>
                      <div className="manga-details__source-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://${getWebsiteDomain(source.website_id)}${source.path}`,
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSource(source)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="manga-details__section">
              <div className="manga-details__section-header">
                <h2>
                  <Clock size={18} />
                  Reading History
                </h2>
              </div>

              {history.length === 0 ? (
                <p className="manga-details__empty">No reading history yet</p>
              ) : (
                <ul className="manga-details__history">
                  {history.map((chapter) => (
                    <li key={chapter.id} className="manga-details__chapter">
                      <span className="manga-details__chapter-number">
                        Chapter {cleanChapterNumber(chapter.number)}
                      </span>
                      <span className="manga-details__chapter-date">
                        {formatDate(chapter.updated_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="manga-details__danger-zone">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={16} />
                Delete Manga
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Manga"
        size="sm"
      >
        <div className="manga-details__delete-modal">
          <p>
            Are you sure you want to delete <strong>{manga.name}</strong>? This
            action cannot be undone.
          </p>
          <div className="manga-details__delete-actions">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        title="Add Source"
        size="sm"
      >
        <div className="manga-details__add-source-modal">
          <div className="manga-details__add-source-field">
            <label htmlFor="website-select">Website</label>
            <select
              id="website-select"
              value={newSource.websiteId}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, websiteId: e.target.value }))
              }
            >
              <option value="">Select a website</option>
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.domain}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Path"
            placeholder="/manga/example"
            value={newSource.path}
            onChange={(e) =>
              setNewSource((prev) => ({ ...prev, path: e.target.value }))
            }
            fullWidth
          />

          <div className="manga-details__add-source-actions">
            <Button
              variant="ghost"
              onClick={() => setIsAddSourceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddSource}
              loading={isAddingSource}
              disabled={!newSource.websiteId || !newSource.path}
            >
              Add Source
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
