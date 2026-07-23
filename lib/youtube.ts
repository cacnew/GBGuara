/**
 * Extrai o ID de um vídeo do YouTube a partir de URLs nos formatos mais
 * comuns (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`). Retorna `null` se
 * a URL não for reconhecida, para não quebrar o card quando o campo
 * `youtube_url` (Fase 14.1) tiver algo fora do padrão.
 */
export function getYoutubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
