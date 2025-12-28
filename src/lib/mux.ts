import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface UploadResponse {
  uploadUrl: string;
  uploadId: string;
  entryId: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function createMuxUpload(mood: string, date?: string): Promise<UploadResponse> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[mux] getSession error:', sessionError);
    throw new Error('Authentication error. Please sign in again.');
  }

  if (!session) {
    console.error('[mux] No session found');
    throw new Error('Please sign in to record a video');
  }

  // Force-refresh session to avoid stale/rotated tokens causing "Invalid JWT"
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    console.warn('[mux] refreshSession warning:', refreshError);
  }

  const accessToken = refreshData?.session?.access_token ?? session.access_token;
  const payload = decodeJwtPayload(accessToken);

  console.log('[mux] user:', session.user.id);
  console.log('[mux] token payload:', payload ? {
    iss: payload.iss,
    aud: payload.aud,
    exp: payload.exp,
    sub: payload.sub,
  } : null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/mux-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': apiKey,
    },
    body: JSON.stringify({
      mood,
      date: date || format(new Date(), 'yyyy-MM-dd'),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[mux] mux-upload failed:', response.status, errorText);
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data || !data.uploadUrl) {
    console.error('[mux] Invalid response from mux-upload:', data);
    throw new Error('Invalid response from server');
  }

  return data;
}

export async function uploadVideoToMux(uploadUrl: string, videoBlob: Blob): Promise<void> {
  console.log('Uploading video to Mux, size:', videoBlob.size);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: videoBlob,
    headers: {
      'Content-Type': 'video/webm',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mux upload failed:', response.status, errorText);
    throw new Error('Failed to upload video to Mux');
  }

  console.log('Video uploaded successfully');
}

export async function checkMuxStatus(entryId: string) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error('Authentication error');
  }

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data: refreshData } = await supabase.auth.refreshSession();
  const accessToken = refreshData?.session?.access_token ?? session.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/mux-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ entryId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mux status check failed:', response.status, errorText);
    throw new Error('Failed to check video status');
  }

  return response.json();
}

export function getMuxStreamUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getMuxThumbnailUrl(playbackId: string, time = 1): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}

export function getMuxGifUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/animated.gif?width=320`;
}
