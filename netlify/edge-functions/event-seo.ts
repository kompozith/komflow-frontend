import type { Config, Context } from '@netlify/edge-functions';

const API_BASE = 'https://api.komflow.kompozith.com/api/v1';

const SOCIAL_BOT_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'skypeuripreview',
  'applebot',
  'baiduspider',
  'googlebot',
  'bingbot',
  'yandexbot',
  'pinterestbot',
  'ia_archiver',
  'embedly',
  'outbrain',
];

function isSocialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export default async function handler(request: Request, context: Context) {
  const userAgent = request.headers.get('user-agent') || '';

  if (!isSocialBot(userAgent)) {
    return context.next();
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Path is /event/:slug
  const slug = pathParts[pathParts.length - 1];

  if (!slug) {
    return context.next();
  }

  let eventData: {
    title?: string;
    subtitle?: string;
    description?: string;
    bannerImageUrl?: string;
  } | null = null;

  try {
    const apiResponse = await fetch(`${API_BASE}/public/events/${slug}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (apiResponse.ok) {
      eventData = await apiResponse.json();
    }
  } catch {
    // Fall back to serving the SPA if api is unreachable
    return context.next();
  }

  if (!eventData) {
    return context.next();
  }

  const title = escapeHtml(eventData.title || 'Komflow - Événement');
  const rawDescription = stripHtml(eventData.subtitle || eventData.description || '');
  const description = escapeHtml(rawDescription.slice(0, 200));
  const imageUrl = eventData.bannerImageUrl ? escapeHtml(eventData.bannerImageUrl) : '';
  const pageUrl = escapeHtml(url.toString());
  const twitterCard = imageUrl ? 'summary_large_image' : 'summary';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title} - Komflow</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${description ? `<meta name="description" content="${description}">` : ''}

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:site_name" content="Komflow">
  ${description ? `<meta property="og:description" content="${description}">` : ''}
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
  ${imageUrl ? `<meta property="og:image:width" content="1200">` : ''}
  ${imageUrl ? `<meta property="og:image:height" content="630">` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${twitterCard}">
  <meta name="twitter:title" content="${title}">
  ${description ? `<meta name="twitter:description" content="${description}">` : ''}
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}

  <meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body>
  <p><a href="${pageUrl}">${title}</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export const config: Config = {
  path: '/event/*',
};
