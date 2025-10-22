import { invoke } from '@tauri-apps/api/core';
import type { RepoSummary, FileChange, DiffHunk, Commit } from '@gitfrisky/shared-types';

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

  // Status
  status: (repoPath: string) =>
    invokeWithError<{ unstaged: FileChange[]; staged: FileChange[] }>('status', { repoPath }),

  // Diff
  getDiff: (repoPath: string, relPath: string, staged: boolean) =>
    invokeWithError<DiffHunk[]>('get_diff', { repoPath, relPath, staged }),

  // Staging
  stage: (repoPath: string, paths: string[]) =>
    invokeWithError<void>('stage', { repoPath, paths }),

  unstage: (repoPath: string, paths: string[]) =>
    invokeWithError<void>('unstage', { repoPath, paths }),

  stageHunk: (repoPath: string, filePath: string, hunk: DiffHunk) =>
    invokeWithError<void>('stage_hunk', { repoPath, filePath, hunk }),

  unstageHunk: (repoPath: string, filePath: string, hunk: DiffHunk) =>
    invokeWithError<void>('unstage_hunk', { repoPath, filePath, hunk }),

  // Commits
  commit: (repoPath: string, message: string) =>
    invokeWithError<Commit>('commit', { repoPath, message }),

  // File watching
  startWatch: (repoPath: string) =>
    invokeWithError<void>('start_watch', { repoPath }),

  stopWatch: () =>
    invokeWithError<void>('stop_watch'),
};
