import { invoke } from '@tauri-apps/api/core';
import type { RepoSummary } from '@gitfrisky/shared-types';

async function invokeWithError<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (e: any) {
    // Tauri wraps errors as strings
    const message = typeof e === 'string' ? e : e.message || 'Unknown error';
    throw new Error(message);
  }
}

export const ipc = {
  // Repo operations
  openRepo: (path: string) =>
    invokeWithError<RepoSummary>('open_repo', { path }),
};
