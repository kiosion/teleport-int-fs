export const BACKEND_URL = 'https://localhost:8081';

export const API_URL = `${BACKEND_URL}/api/v1` as const;

export const API_ENDPOINTS = {
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  ME: 'auth/me',
  FILES: 'files',
} as const;

export const API_ERRORS = {
  INVALID_CREDENTIALS: 'invalid username or password',
  AUTH_REQUIRED: 'authorization required',
  SESSION_EXPIRED: 'session expired',
  SESSION_NOT_FOUND: 'session not found',
  DIR_NOT_FOUND: 'directory not found',
} as const;

export enum SORT_TYPES {
  NAME = 'name',
  MODIFIED = 'modified',
  SIZE = 'size',
  TYPE = 'type',
}

export enum SORT_ORDERS {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
}

export enum SEARCH_PARAMS {
  SORT = 's',
  FILTER = 'q',
}

export const LOGIN_REDIRECT_PATH_PARAM = 'r';

export const LOGIN_REDIRECT_SEARCH_PARAM = 'p';
