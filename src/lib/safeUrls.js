const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

export function safeExternalUrl(rawUrl, allowedProtocols = ['https:'], allowedHosts = null) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    if (!allowedProtocols.includes(url.protocol)) return '';
    if (allowedHosts) {
      const host = url.hostname.toLowerCase();
      const allowed = allowedHosts.some((allowedHost) => {
        const normalized = String(allowedHost || '').toLowerCase();
        return host === normalized || host.endsWith(`.${normalized}`);
      });
      if (!allowed) return '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

export function safeExternalHref(rawUrl, allowedHosts = null) {
  return safeExternalUrl(rawUrl, ['https:'], allowedHosts);
}

export function toSafeEmbeddableVideoUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return YOUTUBE_ID_PATTERN.test(id) ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2];
        return YOUTUBE_ID_PATTERN.test(id) ? `https://www.youtube.com/embed/${id}` : '';
      }

      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v') || '';
        return YOUTUBE_ID_PATTERN.test(id) ? `https://www.youtube.com/embed/${id}` : '';
      }

      if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/live/')) {
        const id = url.pathname.split('/')[2];
        return YOUTUBE_ID_PATTERN.test(id) ? `https://www.youtube.com/embed/${id}` : '';
      }
    }

    if (host === 'vimeo.com' || host === 'www.vimeo.com') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : '';
    }

    if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
      const id = url.pathname.split('/')[2];
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
}

export function toSafeGoogleSheetEmbedUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host !== 'docs.google.com') return '';

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] !== 'spreadsheets') return '';

    const docIndex = segments.indexOf('d');
    const sheetId = docIndex >= 0 ? segments[docIndex + 1] : '';
    if (!/^[A-Za-z0-9_-]{20,}$/.test(sheetId)) return '';

    const hashParams = new URLSearchParams(String(url.hash || '').replace(/^#/, ''));
    const gid = url.searchParams.get('gid') || hashParams.get('gid') || '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/preview?gid=${encodeURIComponent(gid)}&rm=minimal`;
  } catch {
    return '';
  }
}
