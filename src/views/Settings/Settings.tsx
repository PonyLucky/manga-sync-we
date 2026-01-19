import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Globe, Key, Server, RefreshCw, AlertTriangle, Copy, Check, Shield } from 'lucide-react';
import { useApi, useToast } from '@/context';
import { Header, Button, Input, Modal } from '@/components';
import { Website, Setting } from '@/types';
import { setWebsites as setWebsitesStorage } from '@/utils/storage';
import './Settings.scss';

export function Settings() {
  const { api, config, updateConfig, isConfigured, isLoading: isApiLoading } = useApi();
  const { showToast } = useToast();

  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [bearerToken, setBearerToken] = useState(config.bearerToken);
  const [isSaving, setIsSaving] = useState(false);

  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(false);
  const [deletingWebsiteDomain, setDeletingWebsiteDomain] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);

  const [keyAge, setKeyAge] = useState<number | null>(null);
  const [isLoadingKeyAge, setIsLoadingKeyAge] = useState(false);
  const [isRefreshingKey, setIsRefreshingKey] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

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
      fetchKeyAge();
    }
  }, [isConfigured, api, isApiLoading]);

  const fetchWebsites = async () => {
    if (!api) return;

    setIsLoadingWebsites(true);
    try {
      const response = await api.getAllWebsites();
      if (response.status === 'success' && response.data) {
        setWebsites(response.data);
        await setWebsitesStorage(response.data);
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
        const edited: Record<string, string> = {};
        settingsArray.forEach((s) => {
          edited[s.key] = s.value;
        });
        setEditedSettings(edited);
      }
    } catch {
      showToast('Failed to fetch settings', 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchKeyAge = async () => {
    if (!api) return;

    setIsLoadingKeyAge(true);
    try {
      const response = await api.getKeyAge();
      if (response.status === 'success' && response.data) {
        setKeyAge(response.data.age_in_days);
      }
    } catch {
      showToast('Failed to fetch key age', 'error');
    } finally {
      setIsLoadingKeyAge(false);
    }
  };

  const getSettingValue = (key: string): number => {
    const setting = settings.find((s) => s.key === key);
    return setting ? parseInt(setting.value, 10) : 0;
  };

  const warningThreshold = getSettingValue('TTL_KEY_WARNING') || 90;
  const limitThreshold = getSettingValue('TTL_KEY_LIMIT') || 365;
  const daysUntilExpiry = keyAge !== null ? limitThreshold - keyAge : null;
  const showWarning = keyAge !== null && keyAge > warningThreshold;
  const isCritical = daysUntilExpiry !== null && daysUntilExpiry < 30;

  const handleRefreshKey = async () => {
    if (!api) return;

    setIsRefreshingKey(true);
    setShowConfirmModal(false);
    try {
      const response = await api.refreshKey();
      if (response.status === 'success' && response.data) {
        const key = response.data.key;
        setNewKey(key);
        setShowNewKeyModal(true);
        setKeyCopied(false);

        await updateConfig({ apiUrl: config.apiUrl, bearerToken: key });
        setBearerToken(key);
        setKeyAge(0);

        showToast('API key refreshed successfully', 'success');
      } else {
        showToast(response.message || 'Failed to refresh key', 'error');
      }
    } catch {
      showToast('Failed to refresh key', 'error');
    } finally {
      setIsRefreshingKey(false);
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(newKey);
      setKeyCopied(true);
      showToast('Key copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy key', 'error');
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const hasSettingChanged = (key: string): boolean => {
    const original = settings.find((s) => s.key === key);
    return original ? original.value !== editedSettings[key] : false;
  };

  const handleSaveSetting = async (key: string) => {
    if (!api) return;

    const value = editedSettings[key];
    if (value === undefined) return;

    setSavingSettingKey(key);
    try {
      const response = await api.updateSetting(key, value);
      if (response.status === 'success') {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value } : s))
        );
        showToast(`Setting "${key}" updated successfully`, 'success');
      } else {
        showToast(response.message || `Failed to update setting "${key}"`, 'error');
      }
    } catch {
      showToast(`Failed to update setting "${key}"`, 'error');
    } finally {
      setSavingSettingKey(null);
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
      if (response.status === 'success') {
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

  const handleDeleteWebsite = async (domain: string) => {
    if (!api) return;

    setDeletingWebsiteDomain(domain);
    try {
      const response = await api.deleteWebsite(domain);
      if (response.status === 'success') {
        const newWebsites = websites.filter((w) => w.domain !== domain);
        setWebsites(newWebsites);
        await setWebsitesStorage(newWebsites);
        showToast('Website deleted successfully', 'success');
      } else {
        showToast(response.message || 'Failed to delete website', 'error');
      }
    } catch {
      showToast('Failed to delete website', 'error');
    } finally {
      setDeletingWebsiteDomain(null);
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
                  <Shield size={20} />
                  API Key Status
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchKeyAge}
                  disabled={isLoadingKeyAge}
                >
                  <RefreshCw
                    size={16}
                    className={isLoadingKeyAge ? 'spinning' : ''}
                  />
                </Button>
              </div>

              {isLoadingKeyAge || isLoadingSettings ? (
                <div className="settings__loading">Loading key status...</div>
              ) : keyAge === null ? (
                <div className="settings__empty">Unable to fetch key status</div>
              ) : (
                <div className="settings__key-status">
                  <div className="settings__key-info">
                    <div className="settings__key-age">
                      <span className="settings__key-label">Key Age</span>
                      <span className="settings__key-value">{keyAge} days</span>
                    </div>
                    <div className="settings__key-expiry">
                      <span className="settings__key-label">Days Until Expiry</span>
                      <span className={`settings__key-value ${isCritical ? 'settings__key-value--critical' : showWarning ? 'settings__key-value--warning' : ''}`}>
                        {daysUntilExpiry} days
                      </span>
                    </div>
                  </div>

                  {showWarning && (
                    <div className={`settings__key-warning ${isCritical ? 'settings__key-warning--critical' : ''}`}>
                      <AlertTriangle size={18} />
                      <span>
                        {isCritical
                          ? `Your API key expires in ${daysUntilExpiry} days. Refresh it immediately to avoid losing access.`
                          : `Your API key expires in ${daysUntilExpiry} days. Consider refreshing it soon.`}
                      </span>
                    </div>
                  )}

                  <Button
                    variant={showWarning ? 'primary' : 'outline'}
                    onClick={() => setShowConfirmModal(true)}
                    loading={isRefreshingKey}
                  >
                    <RefreshCw size={18} />
                    Refresh API Key
                  </Button>
                </div>
              )}
            </section>

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
                        onClick={() => handleDeleteWebsite(website.domain)}
                        loading={deletingWebsiteDomain === website.domain}
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
                  <Server size={20} />
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
                    <li key={setting.key} className="settings__setting settings__setting--editable">
                      <span className="settings__setting-key">{setting.key}</span>
                      <div className="settings__setting-edit">
                        <input
                          type="text"
                          className="settings__setting-input"
                          value={editedSettings[setting.key] ?? setting.value}
                          onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveSetting(setting.key)}
                          loading={savingSettingKey === setting.key}
                          disabled={!hasSettingChanged(setting.key)}
                        >
                          <Save size={14} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Refresh API Key"
        size="sm"
      >
        <div className="settings__modal-content">
          <div className="settings__modal-warning">
            <AlertTriangle size={24} />
            <p>
              Refreshing your API key will immediately invalidate the current key.
              Make sure to save the new key when it's displayed.
            </p>
          </div>
          <div className="settings__modal-actions">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRefreshKey} loading={isRefreshingKey}>
              Refresh Key
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNewKeyModal}
        onClose={() => setShowNewKeyModal(false)}
        title="New API Key"
        size="md"
      >
        <div className="settings__modal-content">
          <div className="settings__modal-warning">
            <AlertTriangle size={24} />
            <p>
              Copy your new API key now. You won't be able to see it again.
              The extension has been automatically updated with the new key.
            </p>
          </div>
          <div className="settings__new-key">
            <code className="settings__new-key-value">{newKey}</code>
            <Button
              variant={keyCopied ? 'primary' : 'outline'}
              size="sm"
              onClick={handleCopyKey}
            >
              {keyCopied ? <Check size={16} /> : <Copy size={16} />}
              {keyCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="settings__modal-actions">
            <Button variant="primary" onClick={() => setShowNewKeyModal(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
