import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MangaAPI } from '@/api/MangaAPI';
import { StorageData } from '@/types';
import { getStorageData, setStorageData, isConfigured } from '@/utils/storage';

interface ApiContextValue {
  api: MangaAPI | null;
  isLoading: boolean;
  isConfigured: boolean;
  config: StorageData;
  updateConfig: (data: Partial<StorageData>) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<MangaAPI | null>(null);
  const [config, setConfig] = useState<StorageData>({ apiUrl: '', bearerToken: '' });
  const [isLoading, setIsLoading] = useState(true);

  const initializeApi = useCallback((data: StorageData) => {
    if (isConfigured(data)) {
      const apiInstance = new MangaAPI(data.apiUrl, data.bearerToken);
      setApi(apiInstance);
    } else {
      setApi(null);
    }
    setConfig(data);
  }, []);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStorageData();
      initializeApi(data);
    } finally {
      setIsLoading(false);
    }
  }, [initializeApi]);

  const updateConfig = useCallback(
    async (data: Partial<StorageData>) => {
      const newConfig = { ...config, ...data };
      await setStorageData(data);
      initializeApi(newConfig);
    },
    [config, initializeApi]
  );

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  return (
    <ApiContext.Provider
      value={{
        api,
        isLoading,
        isConfigured: isConfigured(config),
        config,
        updateConfig,
        refreshConfig,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
