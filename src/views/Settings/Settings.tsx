import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Globe, Key, Server, RefreshCw } from 'lucide-react';
import { useApi, useToast } from '@/context';
import { Header, Button, Input } from '@/components';
import { Website, Setting } from '@/types';
import './Settings.scss';

export function Settings() {
  const { api, config, updateConfig, isConfigured, isLoading: isApiLoading } = useApi();
  const { showToast } = useToast();

  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [bearerToken, setBearerToken] = useState(config.bearerToken);
  const [isSaving, setIsSaving] = useState(false);

  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(false);
  const [deletingWebsiteId, setDeletingWebsiteId] = useState<number | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    if (!isApiLoading) {
      setApiUrl(config.apiUrl);
      setBearerToken(config.bearerToken);
    }
  }, [config, isApiLoading]);

  useEffect(() => {
    if (isConfigured && api && !isApiLoading) {
      fetchWebsites();
      fetchSettings();
    }
  }, [isConfigured, api, isApiLoading]);

  const fetchWebsites = async () => {
    if (!api) return;

    setIsLoadingWebsites(true);
    try {
      const response = await api.getAllWebsites();
      if (response.status === 'success' && response.data) {
        setWebsites(response.data);
      }
    } catch {
      showToast('Failed to fetch websites', 'error');
    } finally {
      setIsLoadingWebsites(false);
    }
  };

  const fetchSettings = async () => {
    if (!api) return;

    setIsLoadingSettings(true);
    try {
      const response = await api.getAllSettings();
      if (response.status === 'success' && response.data) {
        const settingsArray = Object.entries(response.data).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setSettings(settingsArray);
      }
    } catch {
      showToast('Failed to fetch settings', 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiUrl.trim() || !bearerToken.trim()) {
      showToast('Please fill in both API URL and Bearer Token', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig({ apiUrl, bearerToken });
      showToast('Configuration saved successfully', 'success');
    } catch {
      showToast('Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!api || !newDomain.trim()) return;

    setIsAddingDomain(true);
    try {
      const response = await api.createWebsite(newDomain);
      if (response.status === 'success' && response.data) {
        setNewDomain('');
        showToast('Website added successfully', 'success');
        fetchWebsites();
        fetchSettings();
      } else {
        showToast(response.message || 'Failed to add website', 'error');
      }
    } catch {
      showToast('Failed to add website', 'error');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteWebsite = async (id: number) => {
    if (!api) return;

    setDeletingWebsiteId(id);
    try {
      const response = await api.deleteWebsite(id);
      if (response.status === 'success') {
        setWebsites((prev) => prev.filter((w) => w.id !== id));
        showToast('Website deleted successfully', 'success');
      } else {
        showToast(response.message || 'Failed to delete website', 'error');
      }
    } catch {
      showToast('Failed to delete website', 'error');
    } finally {
      setDeletingWebsiteId(null);
    }
  };

  if (isApiLoading) {
    return (
      <div className="settings">
        <Header />
        <main className="settings__content">
          <h1 className="settings__title">Settings</h1>
          <div className="settings__loading">Loading configuration...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="settings">
      <Header />

      <main className="settings__content">
        <h1 className="settings__title">Settings</h1>

        <section className="settings__section">
          <div className="settings__section-header">
            <h2>
              <Server size={20} />
              API Configuration
            </h2>
          </div>

          <div className="settings__form">
            <Input
              label="API URL"
              placeholder="http://localhost:7783"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              icon={<Globe size={18} />}
              fullWidth
            />

            <Input
              label="Bearer Token"
              type="password"
              placeholder="Your API token"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              icon={<Key size={18} />}
              fullWidth
            />

            <Button
              variant="primary"
              onClick={handleSaveConfig}
              loading={isSaving}
            >
              <Save size={18} />
              Save Configuration
            </Button>
          </div>
        </section>

        {isConfigured && (
          <>
            <section className="settings__section">
              <div className="settings__section-header">
                <h2>
                  <Globe size={20} />
                  Websites
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchWebsites}
                  disabled={isLoadingWebsites}
                >
                  <RefreshCw
                    size={16}
                    className={isLoadingWebsites ? 'spinning' : ''}
                  />
                </Button>
              </div>

              <div className="settings__add-website">
                <Input
                  placeholder="mangasite.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWebsite()}
                  fullWidth
                />
                <Button
                  variant="outline"
                  onClick={handleAddWebsite}
                  loading={isAddingDomain}
                  disabled={!newDomain.trim()}
                >
                  <Plus size={18} />
                  Add
                </Button>
              </div>

              {isLoadingWebsites ? (
                <div className="settings__loading">Loading websites...</div>
              ) : websites.length === 0 ? (
                <div className="settings__empty">No websites configured</div>
              ) : (
                <ul className="settings__websites">
                  {websites.map((website) => (
                    <li key={website.id} className="settings__website">
                      <span className="settings__website-domain">
                        {website.domain}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebsite(website.id)}
                        loading={deletingWebsiteId === website.id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="settings__section">
              <div className="settings__section-header">
                <h2>
                  <Key size={20} />
                  Server Settings
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchSettings}
                  disabled={isLoadingSettings}
                >
                  <RefreshCw
                    size={16}
                    className={isLoadingSettings ? 'spinning' : ''}
                  />
                </Button>
              </div>

              {isLoadingSettings ? (
                <div className="settings__loading">Loading settings...</div>
              ) : settings.length === 0 ? (
                <div className="settings__empty">No server settings available</div>
              ) : (
                <ul className="settings__server-settings">
                  {settings.map((setting) => (
                    <li key={setting.key} className="settings__setting">
                      <span className="settings__setting-key">{setting.key}</span>
                      <span className="settings__setting-value">
                        {setting.value}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
