const apiBaseUrl = (
  (import.meta.env.VITE_ADMIN_API_URL as string | undefined)
  || (import.meta.env.VITE_MESSAGES_API_URL as string | undefined)
  || ''
).replace(/\/+$/, '');

export const getApiUrl = (path: string) => `${apiBaseUrl}${path}`;

export const getApiDisplayUrl = (path: string) => {
  const url = getApiUrl(path);

  if (url.startsWith('http')) return url;
  if (typeof window === 'undefined') return url;

  return `${window.location.origin}${url}`;
};

export const createNetworkErrorMessage = (path: string) => (
  `无法连接后台服务：${getApiDisplayUrl(path)}。请确认 Spring Boot 后端已启动，或检查 Vite 代理 / VITE_ADMIN_API_URL 配置。`
);

export const readCsrfToken = (): string | undefined => {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
};

export const readApiError = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
};

export const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  const csrfToken = readCsrfToken();

  try {
    response = await fetch(getApiUrl(path), {
      ...init,
      credentials: init?.credentials ?? 'include',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(createNetworkErrorMessage(path));
  }

  if (!response.ok) {
    throw new Error(await readApiError(response, '请求失败，请稍后再试。'));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};
