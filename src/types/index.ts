export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
}

export interface Manga {
  id: number;
  name: string;
  cover: string;
  cover_small: string;
  number_unread_chapter: number | null;
}

export interface MangaDetails extends Manga {
  sources?: Source[];
  history?: Chapter[];
}

export interface Website {
  id: number;
  domain: string;
}

export interface Source {
  id: number;
  manga_id: number;
  website_id: number;
  path: string;
  number_unread_chapter: number | null;
}

export interface Chapter {
  id: number;
  manga_id: number;
  number: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface StorageData {
  apiUrl: string;
  bearerToken: string;
}

export interface CreateMangaPayload {
  name: string;
  cover: string;
  cover_small: string;
  website_domain?: string;
  source_path?: string;
}

export interface CreateSourcePayload {
  manga_id: number;
  website_id: number;
  path: string;
}

export interface UpdateMangaPayload {
  name?: string;
  cover?: string;
  cover_small?: string;
  website_domain?: string;
  source_path?: string;
  chapter_number?: string;
}

export interface RefreshUnreadResult {
  manga_id: number;
  manga_name: string;
  domain: string;
  unread_count: number | null;
  error: string | null;
}

export interface RefreshUnreadData {
  total: number;
  success: number;
  errors: number;
  results: RefreshUnreadResult[];
}
