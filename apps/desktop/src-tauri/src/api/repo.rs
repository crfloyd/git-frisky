use crate::domain::types::{Branch, RepoSummary, RepoState};
use git2::{Repository, BranchType, RepositoryState};

// Error conversion helper
fn toe<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

// Map git2 RepositoryState to our domain RepoState
fn map_repo_state(state: RepositoryState) -> RepoState {
    match state {
        RepositoryState::Clean => RepoState::Clean,
        RepositoryState::Merge => RepoState::Merge,
        RepositoryState::Rebase => RepoState::Rebase,
        RepositoryState::RebaseInteractive => RepoState::RebaseInteractive,
        RepositoryState::RebaseMerge => RepoState::RebaseMerge,
        RepositoryState::Revert | RepositoryState::RevertSequence => RepoState::Revert,
        RepositoryState::CherryPick | RepositoryState::CherryPickSequence => RepoState::CherryPick,
        RepositoryState::Bisect => RepoState::Bisect,
        _ => RepoState::Clean,
    }
}

#[tauri::command]
pub fn open_repo(path: String) -> Result<RepoSummary, String> {
    let repo = Repository::open(&path).map_err(toe)?;

    // Check if repo is bare
    let is_bare = repo.is_bare();

    // Check if HEAD is detached
    let is_detached = repo.head_detached().unwrap_or(false);

    // Get repository state
    let state = map_repo_state(repo.state());

    // Get HEAD reference
    let head = if is_detached {
        repo.head().ok().and_then(|h| h.target()).map(|oid| oid.to_string())
    } else {
        repo.head()
            .ok()
            .and_then(|h| h.shorthand().map(|s| s.to_string()))
    };

    // Collect branches
    let mut branches = vec![];
    for br in repo.branches(Some(BranchType::Local)).map_err(toe)? {
        let (b, _) = br.map_err(toe)?;
        let name = b.name().ok().flatten().unwrap_or("").to_string();
        let is_head = b.is_head();
        let full = format!("refs/heads/{}", name);

        // Get upstream info
        let upstream = b.upstream()
            .ok()
            .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

        // Calculate ahead/behind for this branch
        let (ahead, behind) = if let Some(local_oid) = b.get().target() {
            if let Some(ref up_name) = upstream {
                if let Ok(upstream_ref) = repo.find_reference(up_name) {
                    if let Some(upstream_oid) = upstream_ref.target() {
                        repo.graph_ahead_behind(local_oid, upstream_oid)
                            .unwrap_or((0, 0))
                    } else {
                        (0, 0)
                    }
                } else {
                    (0, 0)
                }
            } else {
                (0, 0)
            }
        } else {
            (0, 0)
        };

        branches.push(Branch {
            name: name.clone(),
            full_name: full,
            is_head,
            is_remote: false,
            upstream,
            ahead: ahead as i32,
            behind: behind as i32,
        });
    }

    Ok(RepoSummary {
        path: path.clone(),
        branches,
        head,
        is_bare,
        is_detached,
        state,
    })
}
