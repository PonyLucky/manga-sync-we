import browser from 'webextension-polyfill';
import { StorageData, Website, Source } from '@/types';

const STORAGE_KEYS = {
  API_URL: 'apiUrl',
  BEARER_TOKEN: 'bearerToken',
  WEBSITES: 'websites',
  SOURCES: 'sources',
} as const;

export async function getStorageData(): Promise<StorageData> {
  const result = await browser.storage.local.get([
    STORAGE_KEYS.API_URL,
    STORAGE_KEYS.BEARER_TOKEN,
  ]);

  // Remove trailing slashes from apiUrl to prevent double slashes in API paths
  const apiUrl = (result[STORAGE_KEYS.API_URL] || '').replace(/\/+$/, '');

  return {
    apiUrl,
    bearerToken: result[STORAGE_KEYS.BEARER_TOKEN] || '',
  };
}

export async function setStorageData(data: Partial<StorageData>): Promise<void> {
  const storageData: Record<string, string> = {};

  if (data.apiUrl !== undefined) {
    // Remove trailing slashes to prevent double slashes in API paths
    storageData[STORAGE_KEYS.API_URL] = data.apiUrl.replace(/\/+$/, '');
  }
  if (data.bearerToken !== undefined) {
    storageData[STORAGE_KEYS.BEARER_TOKEN] = data.bearerToken;
  }

  await browser.storage.local.set(storageData);
}

export async function clearStorageData(): Promise<void> {
  await browser.storage.local.remove([
    STORAGE_KEYS.API_URL,
    STORAGE_KEYS.BEARER_TOKEN,
  ]);
}

export function isConfigured(data: StorageData): boolean {
  return Boolean(data.apiUrl && data.bearerToken);
}

export async function getWebsites(): Promise<Website[]> {
  const result = await browser.storage.local.get(STORAGE_KEYS.WEBSITES);
  return result[STORAGE_KEYS.WEBSITES] || [];
}

export async function setWebsites(websites: Website[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.WEBSITES]: websites });
}

export async function getSources(): Promise<Source[]> {
  const result = await browser.storage.local.get(STORAGE_KEYS.SOURCES);
  return result[STORAGE_KEYS.SOURCES] || [];
}

export async function setSources(sources: Source[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.SOURCES]: sources });
}
