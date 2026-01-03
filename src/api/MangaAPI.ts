import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  Manga,
  MangaDetails,
  Website,
  Source,
  Chapter,
  Setting,
  CreateMangaPayload,
  CreateSourcePayload,
  UpdateMangaPayload,
} from '@/types';

export class MangaAPI {
  private client: AxiosInstance;

  constructor(baseURL: string, token: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updateConfig(baseURL: string, token: string): void {
    this.client.defaults.baseURL = baseURL;
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  private async request<T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>({
        method,
        url,
        data,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<T>>;
      if (axiosError.response) {
        return axiosError.response.data;
      }
      return {
        status: 'error',
        message: axiosError.message || 'Network error',
        data: null,
      };
    }
  }

  // Manga endpoints
  async getAllManga(): Promise<ApiResponse<Manga[]>> {
    return this.request<Manga[]>('get', '/manga');
  }

  async getManga(id: number): Promise<ApiResponse<MangaDetails>> {
    return this.request<MangaDetails>('get', `/manga/${id}`);
  }

  async createManga(payload: CreateMangaPayload): Promise<ApiResponse<Manga>> {
    return this.request<Manga>('post', '/manga', payload);
  }

  async updateManga(id: number, payload: UpdateMangaPayload): Promise<ApiResponse<Manga>> {
    return this.request<Manga>('patch', `/manga/${id}`, payload);
  }

  async deleteManga(id: number): Promise<ApiResponse<null>> {
    return this.request<null>('delete', `/manga/${id}`);
  }

  // Source endpoints
  async getMangaSources(mangaId: number): Promise<ApiResponse<Source[]>> {
    return this.request<Source[]>('get', `/manga/${mangaId}/source`);
  }

  async createSource(payload: CreateSourcePayload): Promise<ApiResponse<Source>> {
    return this.request<Source>('post', '/source', payload);
  }

  async deleteSource(id: number): Promise<ApiResponse<null>> {
    return this.request<null>('delete', `/source/${id}`);
  }

  // History endpoints
  async getMangaHistory(mangaId: number): Promise<ApiResponse<Chapter[]>> {
    return this.request<Chapter[]>('get', `/manga/${mangaId}/history`);
  }

  // Website endpoints
  async getWebsite(domain: string): Promise<ApiResponse<Website>> {
    return this.request<Website>('get', `/website/${encodeURIComponent(domain)}`);
  }

  async createWebsite(domain: string): Promise<ApiResponse<Website>> {
    return this.request<Website>('post', `/website/${encodeURIComponent(domain)}`);
  }

  async getAllWebsites(): Promise<ApiResponse<Website[]>> {
    return this.request<Website[]>('get', '/website');
  }

  // Settings endpoints
  async getAllSettings(): Promise<ApiResponse<Setting[]>> {
    return this.request<Setting[]>('get', '/setting');
  }
}

let apiInstance: MangaAPI | null = null;

export function getAPI(): MangaAPI | null {
  return apiInstance;
}

export function initializeAPI(baseURL: string, token: string): MangaAPI {
  apiInstance = new MangaAPI(baseURL, token);
  return apiInstance;
}
