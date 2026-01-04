import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
  Globe,
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
      const response = await api.createSource({
        manga_id: Number(id),
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

  const handleDeleteSource = async (sourceId: number) => {
    if (!api) return;

    try {
      const response = await api.deleteSource(sourceId);
      if (response.status === 'success') {
        showToast('Source deleted', 'success');
        setSources((prev) => prev.filter((s) => s.id !== sourceId));
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
          </div>

          <div className="manga-details__info">
            <h1 className="manga-details__title">{manga.name}</h1>

            <div className="manga-details__actions">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={16} />
                Delete
              </Button>
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
                        <span className="manga-details__source-domain">
                          {getWebsiteDomain(source.website_id)}
                        </span>
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
                          onClick={() => handleDeleteSource(source.id)}
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
                        Chapter {chapter.number}
                      </span>
                      <span className="manga-details__chapter-date">
                        {formatDate(chapter.updated_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
