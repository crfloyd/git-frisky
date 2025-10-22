use serde::{Serialize, Deserialize};
use thiserror::Error;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Branch {
    pub name: String,
    pub full_name: String,
    pub is_head: bool,
    pub is_remote: bool,
    pub upstream: Option<String>,
    pub ahead: i32,
    pub behind: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Commit {
    pub oid: String,
    pub author: String,
    pub email: String,
    pub timestamp: i64,
    pub summary: String,
    pub message: Option<String>, // Full message (lazy-loaded)
    pub parents: Vec<String>,
    pub refs: Vec<String>, // Branch/tag names pointing to this commit
    pub lane: Option<u32>, // Computed lane for graph rendering
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileChange {
    pub path: String,
    pub status: FileStatus,
    pub old_path: Option<String>, // For renames
    pub additions: u32,
    pub deletions: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum FileStatus {
    A, // Added
    M, // Modified
    D, // Deleted
    R, // Renamed
    U, // Untracked
    C, // Conflicted
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiffHunk {
    pub header: String, // @@ -15,6 +15,9 @@
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiffLine {
    pub content: String,
    pub line_type: LineType,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum LineType {
    Context,
    Addition,
    Deletion,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RepoSummary {
    pub path: String,
    pub branches: Vec<Branch>,
    pub head: Option<String>, // Current branch name or "detached HEAD"
    pub is_bare: bool,
    pub is_detached: bool,
    pub state: RepoState,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum RepoState {
    Clean,
    Merge,
    Rebase,
    RebaseInteractive,
    RebaseMerge,
    Revert,
    CherryPick,
    Bisect,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Stash {
    pub index: usize,
    pub message: String,
    pub oid: String,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Tag {
    pub name: String,
    pub full_name: String,
    pub target_oid: String,
    pub message: Option<String>, // Annotated tag message
    pub tagger: Option<String>,
    pub timestamp: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Remote {
    pub name: String,
    pub url: String,
    pub fetch_url: Option<String>,
    pub push_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProgressEvent {
    pub phase: ProgressPhase,
    pub current: usize,
    pub total: usize,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum ProgressPhase {
    Counting,
    Compressing,
    Receiving,
    Resolving,
    Indexing,
    Checkout,
}

#[derive(Error, Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "message")]
pub enum GitError {
    #[error("Repository not found: {0}")]
    RepoNotFound(String),

    #[error("Not a git repository: {0}")]
    NotARepo(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),

    #[error("Authentication required")]
    AuthRequired,

    #[error("Merge conflict in {0}")]
    MergeConflict(String),

    #[error("Repository in unsafe state: {0:?}")]
    UnsafeState(RepoState),

    #[error("Nothing to commit")]
    NothingToCommit,

    #[error("Detached HEAD")]
    DetachedHead,
}

// Convert git2::Error to GitError with user-friendly messages
impl From<git2::Error> for GitError {
    fn from(e: git2::Error) -> Self {
        match e.code() {
            git2::ErrorCode::NotFound => GitError::RepoNotFound(e.message().to_string()),
            git2::ErrorCode::Auth => GitError::AuthRequired,
            git2::ErrorCode::Conflict => GitError::MergeConflict(e.message().to_string()),
            _ => GitError::OperationFailed(e.message().to_string()),
        }
    }
}
