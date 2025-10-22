export type Branch = {
  name: string;
  fullName: string;
  isHead: boolean;
  isRemote: boolean;
  upstream?: string;
  ahead: number;
  behind: number;
};

export type Commit = {
  oid: string;
  author: string;
  email: string;
  timestamp: number;
  summary: string;
  message?: string;
  parents: string[];
  refs: string[];
  lane?: number;
};

export type FileStatus = 'A' | 'M' | 'D' | 'R' | 'U' | 'C';

export type FileChange = {
  path: string;
  status: FileStatus;
  oldPath?: string;
  additions: number;
  deletions: number;
};

export type LineType = 'context' | 'addition' | 'deletion';

export type DiffLine = {
  content: string;
  lineType: LineType;
  oldLineno?: number;
  newLineno?: number;
};

export type DiffHunk = {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
};

export type RepoState = 'clean' | 'merge' | 'rebase' | 'rebaseInteractive' | 'rebaseMerge' | 'revert' | 'cherryPick' | 'bisect';

export type RepoSummary = {
  path: string;
  branches: Branch[];
  head?: string;
  isBare: boolean;
  isDetached: boolean;
  state: RepoState;
};

export type Stash = {
  index: number;
  message: string;
  oid: string;
  timestamp: number;
};

export type Tag = {
  name: string;
  fullName: string;
  targetOid: string;
  message?: string;
  tagger?: string;
  timestamp?: number;
};

export type Remote = {
  name: string;
  url: string;
  fetchUrl?: string;
  pushUrl?: string;
};

export type ProgressPhase = 'counting' | 'compressing' | 'receiving' | 'resolving' | 'indexing' | 'checkout';

export type ProgressEvent = {
  phase: ProgressPhase;
  current: number;
  total: number;
  message?: string;
};

export type GitError = {
  type: 'RepoNotFound' | 'NotARepo' | 'InvalidPath' | 'OperationFailed' | 'AuthRequired' | 'MergeConflict' | 'UnsafeState' | 'NothingToCommit' | 'DetachedHead';
  message: string;
};
