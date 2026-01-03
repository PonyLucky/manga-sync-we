import browser from 'webextension-polyfill';
import { StorageData } from '@/types';

const STORAGE_KEYS = {
  API_URL: 'apiUrl',
  BEARER_TOKEN: 'bearerToken',
} as const;

export async function getStorageData(): Promise<StorageData> {
  const result = await browser.storage.local.get([
    STORAGE_KEYS.API_URL,
    STORAGE_KEYS.BEARER_TOKEN,
  ]);

  return {
    apiUrl: result[STORAGE_KEYS.API_URL] || '',
    bearerToken: result[STORAGE_KEYS.BEARER_TOKEN] || '',
  };
}

export async function setStorageData(data: Partial<StorageData>): Promise<void> {
  const storageData: Record<string, string> = {};

  if (data.apiUrl !== undefined) {
    storageData[STORAGE_KEYS.API_URL] = data.apiUrl;
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
