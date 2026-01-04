import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/components';
import { useApi, useToast } from '@/context';
import type { Website } from '@/types';
import './AddMangaModal.scss';

interface AddMangaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  cover: string;
  coverSmall: string;
  domain: string;
  path: string;
}

interface FormErrors {
  name?: string;
  cover?: string;
  coverSmall?: string;
  domain?: string;
  path?: string;
}

export function AddMangaModal({ isOpen, onClose, onSuccess }: AddMangaModalProps) {
  const { api } = useApi();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    cover: '',
    coverSmall: '',
    domain: '',
    path: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);

  useEffect(() => {
    if (isOpen && api) {
      api.getAllWebsites().then((response) => {
        if (response.status === 'success' && response.data) {
          setWebsites(response.data);
        }
      });
    }
  }, [isOpen, api]);

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.cover.trim()) {
      newErrors.cover = 'Cover URL is required';
    }
    if (!formData.coverSmall.trim()) {
      newErrors.coverSmall = 'Small cover URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !api) return;

    setIsLoading(true);
    try {
      // First, check if domain exists (if provided)
      let websiteId: number | null = null;
      if (formData.domain.trim()) {
        const websiteResponse = await api.getWebsite(formData.domain);
        if (websiteResponse.status === 'success' && websiteResponse.data) {
          websiteId = websiteResponse.data.id;
        } else {
          showToast(`Domain "${formData.domain}" not found. Add it in Settings first.`, 'error');
          setIsLoading(false);
          return;
        }
      }

      // Create the manga
      const mangaResponse = await api.createManga({
        name: formData.name,
        cover: formData.cover,
        cover_small: formData.coverSmall,
        website_domain: formData.domain.trim() || undefined,
        source_path: formData.path.trim() || undefined,
      });

      if (mangaResponse.status !== 'success' || !mangaResponse.data) {
        showToast(mangaResponse.message || 'Failed to create manga', 'error');
        setIsLoading(false);
        return;
      }

      // Create source if domain was provided
      if (websiteId && formData.path.trim()) {
        const sourceResponse = await api.createSource({
          manga_id: mangaResponse.data.id,
          website_id: websiteId,
          path: formData.path,
        });

        if (sourceResponse.status !== 'success') {
          showToast('Manga created but failed to add source', 'error');
        }
      }

      showToast('Manga added successfully', 'success');
      resetForm();
      onSuccess();
    } catch {
      showToast('An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cover: '',
      coverSmall: '',
      domain: '',
      path: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Manga" size="md">
      <form className="add-manga-form" onSubmit={handleSubmit}>
        <Input
          label="Manga Name"
          placeholder="Enter manga name"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
          fullWidth
        />

        <Input
          label="Cover URL"
          placeholder="https://example.com/cover.jpg"
          value={formData.cover}
          onChange={handleChange('cover')}
          error={errors.cover}
          fullWidth
        />

        <Input
          label="Small Cover URL"
          placeholder="https://example.com/cover-small.jpg"
          value={formData.coverSmall}
          onChange={handleChange('coverSmall')}
          error={errors.coverSmall}
          fullWidth
        />

        <div className="add-manga-form__divider">
          <span>Initial Source (Optional)</span>
        </div>

        <div className="input-wrapper input-wrapper--full-width">
          <label className="input-wrapper__label">Domain</label>
          <div className={`input-container ${errors.domain ? 'input-container--error' : ''}`}>
            <select
              className="input"
              value={formData.domain}
              onChange={handleChange('domain')}
            >
              <option value="">Select a website</option>
              {websites.map((website) => (
                <option key={website.id} value={website.domain}>
                  {website.domain}
                </option>
              ))}
            </select>
          </div>
          {errors.domain && <span className="input-wrapper__error">{errors.domain}</span>}
        </div>

        <Input
          label="Path"
          placeholder="/manga/example-manga"
          value={formData.path}
          onChange={handleChange('path')}
          error={errors.path}
          fullWidth
        />

        <div className="add-manga-form__actions">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Add Manga
          </Button>
        </div>
      </form>
    </Modal>
  );
}
