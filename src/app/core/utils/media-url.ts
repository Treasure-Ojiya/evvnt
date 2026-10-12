import { environment } from '../../../environments/environment';

export function mediaUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  try {
    return new URL(url, environment.BASE_URL).href;
  } catch {
    return url;
  }
}
