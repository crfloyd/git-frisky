use crate::domain::types::{Branch, RepoSummary, RepoState, StatusPayload, FileChange, FileStatus, DiffHunk, DiffLine, LineType, Commit};
use git2::{Repository, BranchType, RepositoryState, StatusOptions, StatusShow, Status, DiffOptions, Signature, ApplyLocation, Diff};

// Error conversion helper
fn toe<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

// Helper to show untracked file as all additions
fn get_untracked_file_diff(repo: &Repository, rel_path: &str) -> Result<Vec<DiffHunk>, String> {
    use std::fs;
    use std::io::Read;

    let repo_path = repo.path().parent().ok_or("Invalid repo path")?;
    let file_path = repo_path.join(rel_path);

    // Read file content
    let mut content = String::new();
    let mut file = fs::File::open(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    file.read_to_string(&mut content).map_err(|e| format!("Failed to read file content: {}", e))?;

    // Split into lines
    let lines: Vec<&str> = content.lines().collect();
    let line_count = lines.len() as u32;

    // Create a single hunk with all lines as additions
    let mut hunk_lines = vec![];
    for (idx, line) in lines.iter().enumerate() {
        hunk_lines.push(DiffLine {
            content: line.to_string(),
            line_type: LineType::Addition,
            old_lineno: None,
            new_lineno: Some((idx + 1) as u32),
        });
    }

    let hunk = DiffHunk {
        header: format!("@@ -0,0 +1,{} @@", line_count),
        old_start: 0,
        old_lines: 0,
        new_start: 1,
        new_lines: line_count,
        lines: hunk_lines,
    };

    Ok(vec![hunk])
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

#[tauri::command]
pub fn status(repo_path: String) -> Result<StatusPayload, String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;

    // Configure status options to include untracked files
    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .show(StatusShow::IndexAndWorkdir);

    let statuses = repo.statuses(Some(&mut opts)).map_err(toe)?;

    let mut staged = vec![];
    let mut unstaged = vec![];

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let status_flags = entry.status();

        // Calculate additions/deletions (we'll set to 0 for now, diff will provide real numbers)
        let additions = 0;
        let deletions = 0;

        // Check for staged changes (index modifications)
        if status_flags.intersects(Status::INDEX_NEW) {
            staged.push(FileChange {
                path: path.clone(),
                status: FileStatus::A,
                old_path: None,
                additions,
                deletions,
            });
        } else if status_flags.intersects(Status::INDEX_MODIFIED) {
            staged.push(FileChange {
                path: path.clone(),
                status: FileStatus::M,
                old_path: None,
                additions,
                deletions,
            });
        } else if status_flags.intersects(Status::INDEX_DELETED) {
            staged.push(FileChange {
                path: path.clone(),
                status: FileStatus::D,
                old_path: None,
                additions,
                deletions,
            });
        } else if status_flags.intersects(Status::INDEX_RENAMED) {
            staged.push(FileChange {
                path: path.clone(),
                status: FileStatus::R,
                old_path: None, // TODO: get actual old path from diff
                additions,
                deletions,
            });
        }

        // Check for unstaged changes (working tree modifications)
        if status_flags.intersects(Status::WT_NEW) {
            unstaged.push(FileChange {
                path: path.clone(),
                status: FileStatus::U,
                old_path: None,
                additions,
                deletions,
            });
        } else if status_flags.intersects(Status::WT_MODIFIED) {
            unstaged.push(FileChange {
                path: path.clone(),
                status: FileStatus::M,
                old_path: None,
                additions,
                deletions,
            });
        } else if status_flags.intersects(Status::WT_DELETED) {
            unstaged.push(FileChange {
                path: path.clone(),
                status: FileStatus::D,
                old_path: None,
                additions,
                deletions,
            });
        } else if status_flags.intersects(Status::WT_RENAMED) {
            unstaged.push(FileChange {
                path: path.clone(),
                status: FileStatus::R,
                old_path: None,
                additions,
                deletions,
            });
        }

        // Check for conflicts
        if status_flags.intersects(Status::CONFLICTED) {
            unstaged.push(FileChange {
                path: path.clone(),
                status: FileStatus::C,
                old_path: None,
                additions,
                deletions,
            });
        }
    }

    Ok(StatusPayload { unstaged, staged })
}

#[tauri::command]
pub fn get_diff(repo_path: String, rel_path: String, staged: bool) -> Result<Vec<DiffHunk>, String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;

    // Check if file is tracked in the index
    let index = repo.index().map_err(toe)?;
    let path = std::path::Path::new(&rel_path);
    let is_tracked = index.get_path(path, 0).is_some();

    // For untracked files in unstaged view, show entire file as additions
    if !staged && !is_tracked {
        return get_untracked_file_diff(&repo, &rel_path);
    }

    let mut opts = DiffOptions::new();
    opts.pathspec(&rel_path);
    opts.context_lines(3);
    opts.include_untracked(true); // Include untracked files
    opts.show_untracked_content(true); // Show content of untracked files

    let diff = if staged {
        // Staged: diff between HEAD tree and index
        let head_tree = repo.head()
            .and_then(|h| h.peel_to_tree())
            .ok(); // HEAD may not exist (unborn repo)
        repo.diff_tree_to_index(head_tree.as_ref(), None, Some(&mut opts)).map_err(toe)?
    } else {
        // Unstaged: diff between index and working directory
        repo.diff_index_to_workdir(None, Some(&mut opts)).map_err(toe)?
    };

    // Use git2's native foreach API to extract hunks directly
    use std::cell::RefCell;
    use std::rc::Rc;

    let hunks = Rc::new(RefCell::new(vec![]));
    let current_hunk: Rc<RefCell<Option<DiffHunk>>> = Rc::new(RefCell::new(None));
    let old_lineno = Rc::new(RefCell::new(0u32));
    let new_lineno = Rc::new(RefCell::new(0u32));

    let hunks_clone = hunks.clone();
    let current_hunk_clone = current_hunk.clone();
    let current_hunk_clone2 = current_hunk.clone();
    let old_lineno_clone = old_lineno.clone();
    let new_lineno_clone = new_lineno.clone();

    diff.foreach(
        &mut |_delta, _progress| true,
        None,
        Some(&mut move |_delta, hunk| {
            // Push previous hunk if exists
            if let Some(hunk) = current_hunk_clone.borrow_mut().take() {
                hunks_clone.borrow_mut().push(hunk);
            }

            // Start new hunk
            let header = String::from_utf8_lossy(hunk.header()).to_string();
            *current_hunk_clone.borrow_mut() = Some(DiffHunk {
                header: header.trim().to_string(),
                old_start: hunk.old_start(),
                old_lines: hunk.old_lines(),
                new_start: hunk.new_start(),
                new_lines: hunk.new_lines(),
                lines: vec![],
            });

            *old_lineno_clone.borrow_mut() = hunk.old_start();
            *new_lineno_clone.borrow_mut() = hunk.new_start();
            true
        }),
        Some(&mut move |_delta, _hunk, line| {
            if let Some(ref mut hunk) = *current_hunk_clone2.borrow_mut() {
                let origin = line.origin();
                let content = String::from_utf8_lossy(line.content()).to_string();

                let mut old_ln = old_lineno.borrow_mut();
                let mut new_ln = new_lineno.borrow_mut();

                let (line_type, old_line, new_line) = match origin {
                    '+' | '>' => {
                        let nl = *new_ln;
                        *new_ln += 1;
                        (LineType::Addition, None, Some(nl))
                    }
                    '-' | '<' => {
                        let ol = *old_ln;
                        *old_ln += 1;
                        (LineType::Deletion, Some(ol), None)
                    }
                    ' ' | '=' => {
                        let ol = *old_ln;
                        let nl = *new_ln;
                        *old_ln += 1;
                        *new_ln += 1;
                        (LineType::Context, Some(ol), Some(nl))
                    }
                    _ => return true, // Skip other line types
                };

                hunk.lines.push(DiffLine {
                    content: content.trim_end_matches('\n').to_string(),
                    line_type,
                    old_lineno: old_line,
                    new_lineno: new_line,
                });
            }
            true
        }),
    ).map_err(toe)?;

    // Push last hunk
    if let Some(hunk) = current_hunk.borrow_mut().take() {
        hunks.borrow_mut().push(hunk);
    }

    // Extract final result from Rc<RefCell<>>
    let final_hunks = Rc::try_unwrap(hunks)
        .unwrap_or_else(|_| panic!("Failed to unwrap hunks"))
        .into_inner();

    Ok(final_hunks)
}

#[tauri::command]
pub fn stage(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;
    let mut index = repo.index().map_err(toe)?;

    for path in paths {
        index.add_path(std::path::Path::new(&path)).map_err(toe)?;
    }

    index.write().map_err(toe)?;
    Ok(())
}

#[tauri::command]
pub fn unstage(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;

    // Get HEAD tree to reset index to
    let head_tree = repo.head()
        .and_then(|h| h.peel_to_tree())
        .ok();

    let mut index = repo.index().map_err(toe)?;

    for path in paths {
        let path_buf = std::path::Path::new(&path);

        if let Some(ref tree) = head_tree {
            // Reset index entry to HEAD version
            let tree_entry = tree.get_path(path_buf);
            if let Ok(entry) = tree_entry {
                let oid = entry.id();
                let mode = entry.filemode();
                let blob = repo.find_blob(oid).map_err(toe)?;

                // Remove and re-add from HEAD to unstage changes
                index.remove_path(path_buf).map_err(toe)?;
                index.add_frombuffer(&git2::IndexEntry {
                    ctime: git2::IndexTime::new(0, 0),
                    mtime: git2::IndexTime::new(0, 0),
                    dev: 0,
                    ino: 0,
                    mode: mode as u32,
                    uid: 0,
                    gid: 0,
                    file_size: blob.size() as u32,
                    id: oid,
                    flags: 0,
                    flags_extended: 0,
                    path: path.as_bytes().to_vec(),
                }, blob.content()).map_err(toe)?;
            } else {
                // File was newly added, just remove from index
                index.remove_path(path_buf).map_err(toe)?;
            }
        } else {
            // No HEAD (initial commit), just remove from index
            index.remove_path(path_buf).map_err(toe)?;
        }
    }

    index.write().map_err(toe)?;
    Ok(())
}

#[tauri::command]
pub fn commit(repo_path: String, message: String) -> Result<Commit, String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;

    // Check repo state - only allow commits in clean state
    if repo.state() != RepositoryState::Clean {
        return Err(format!("Cannot commit during {:?}. Please complete or abort the current operation.", repo.state()));
    }

    // Get or create signature from config
    let sig = repo.signature()
        .or_else(|_| {
            // Fallback: read from git config manually
            let config = repo.config().map_err(toe)?;
            let name = config.get_string("user.name").map_err(toe)?;
            let email = config.get_string("user.email").map_err(toe)?;
            Signature::now(&name, &email).map_err(toe)
        })
        .map_err(toe)?;

    let mut index = repo.index().map_err(toe)?;

    // Check if index has staged changes
    let is_empty = repo.is_empty().map_err(toe)?;
    let head_tree = if is_empty {
        None
    } else {
        Some(repo.head().map_err(toe)?.peel_to_tree().map_err(toe)?)
    };

    let diff = repo.diff_tree_to_index(head_tree.as_ref(), Some(&index), None).map_err(toe)?;
    if diff.deltas().count() == 0 {
        return Err("Nothing to commit - no changes staged".to_string());
    }

    // Write tree from index
    let tree_id = index.write_tree().map_err(toe)?;
    let tree = repo.find_tree(tree_id).map_err(toe)?;

    // Get parent commit (if not first commit)
    let parents: Vec<git2::Commit> = if is_empty {
        vec![]
    } else {
        vec![repo.head().map_err(toe)?.peel_to_commit().map_err(toe)?]
    };
    let parent_refs: Vec<&git2::Commit> = parents.iter().collect();

    // Create commit
    let oid = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &message,
        &tree,
        &parent_refs,
    ).map_err(toe)?;

    let git_commit = repo.find_commit(oid).map_err(toe)?;

    Ok(Commit {
        oid: oid.to_string(),
        author: sig.name().unwrap_or("").to_string(),
        email: sig.email().unwrap_or("").to_string(),
        timestamp: git_commit.time().seconds(),
        summary: git_commit.summary().unwrap_or("").to_string(),
        message: None, // Don't include full message in response
        parents: parents.iter().map(|p| p.id().to_string()).collect(),
        refs: vec![],
        lane: None,
    })
}

#[tauri::command]
pub fn stage_hunk(repo_path: String, file_path: String, hunk: DiffHunk) -> Result<(), String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;

    // Reconstruct a valid unified diff patch from the hunk
    // We need the full patch format including headers
    let mut patch_text = String::new();

    // Add diff header
    patch_text.push_str(&format!("diff --git a/{} b/{}\n", file_path, file_path));
    patch_text.push_str(&format!("--- a/{}\n", file_path));
    patch_text.push_str(&format!("+++ b/{}\n", file_path));

    // Add hunk header
    patch_text.push_str(&hunk.header);
    patch_text.push('\n');

    // Add hunk lines with proper prefixes
    for line in &hunk.lines {
        let prefix = match line.line_type {
            LineType::Addition => '+',
            LineType::Deletion => '-',
            LineType::Context => ' ',
        };
        patch_text.push(prefix);
        patch_text.push_str(&line.content);
        if !line.content.ends_with('\n') {
            patch_text.push('\n');
        }
    }

    // Create a Diff object from the patch text
    let diff = Diff::from_buffer(patch_text.as_bytes()).map_err(toe)?;

    // Apply the diff to the index (staging area)
    repo.apply(&diff, ApplyLocation::Index, None).map_err(toe)?;

    Ok(())
}

#[tauri::command]
pub fn log(repo_path: String, limit: Option<usize>) -> Result<Vec<Commit>, String> {
    use git2::Sort;

    let repo = Repository::open(&repo_path).map_err(toe)?;
    let limit = limit.unwrap_or(500); // Default to 500 commits

    // Create revwalk with time sort (equivalent to git log --date-order)
    // This shows commits in chronological order across all branches
    let mut revwalk = repo.revwalk().map_err(toe)?;
    revwalk.set_sorting(Sort::TIME).map_err(toe)?;

    // Push ALL branches (local + remote) to show complete graph like GitKraken
    // This ensures we see commits from all branches, not just the current one
    let mut has_commits = false;

    // Push all local branch heads
    if let Ok(branches) = repo.branches(Some(git2::BranchType::Local)) {
        for branch_result in branches {
            if let Ok((branch, _)) = branch_result {
                let reference = branch.get();
                if let Some(oid) = reference.target() {
                    revwalk.push(oid).map_err(toe)?;
                    has_commits = true;
                }
            }
        }
    }

    // Push all remote branch heads
    if let Ok(branches) = repo.branches(Some(git2::BranchType::Remote)) {
        for branch_result in branches {
            if let Ok((branch, _)) = branch_result {
                let reference = branch.get();
                if let Some(oid) = reference.target() {
                    revwalk.push(oid).map_err(toe)?;
                    has_commits = true;
                }
            }
        }
    }

    // If no branches found, try HEAD as fallback
    if !has_commits {
        if let Ok(head) = repo.head() {
            if let Some(head_oid) = head.target() {
                revwalk.push(head_oid).map_err(toe)?;
                has_commits = true;
            }
        }
    }

    // No commits yet - return empty list
    if !has_commits {
        return Ok(vec![]);
    }

    let mut commits = vec![];

    for oid_result in revwalk.take(limit) {
        let oid = oid_result.map_err(toe)?;
        let commit = repo.find_commit(oid).map_err(toe)?;

        // Get parent OIDs
        let parents: Vec<String> = commit.parents().map(|p| p.id().to_string()).collect();

        // Get commit signature
        let author = commit.author();
        let author_name = author.name().unwrap_or("Unknown").to_string();
        let author_email = author.email().unwrap_or("").to_string();

        // Get commit message
        let summary = commit.summary().unwrap_or("").to_string();
        let message = commit.message().map(|m| m.to_string());

        commits.push(Commit {
            oid: oid.to_string(),
            author: author_name,
            email: author_email,
            timestamp: commit.time().seconds(),
            summary,
            message,
            parents,
            refs: vec![], // TODO: Add branch/tag refs in Phase 5
            lane: None,   // Will be computed on frontend for MVP
        });
    }

    Ok(commits)
}

#[tauri::command]
pub fn unstage_hunk(repo_path: String, file_path: String, hunk: DiffHunk) -> Result<(), String> {
    let repo = Repository::open(&repo_path).map_err(toe)?;

    // To unstage a hunk, we need to apply the reverse patch to the index
    // This means swapping additions and deletions
    let mut patch_text = String::new();

    // Add diff header (reversed: b -> a)
    patch_text.push_str(&format!("diff --git a/{} b/{}\n", file_path, file_path));
    patch_text.push_str(&format!("--- a/{}\n", file_path));
    patch_text.push_str(&format!("+++ b/{}\n", file_path));

    // Reverse the hunk header (swap old and new line counts)
    // Original: @@ -old_start,old_lines +new_start,new_lines @@
    // Reversed: @@ -new_start,new_lines +old_start,old_lines @@
    let reversed_header = format!(
        "@@ -{},{} +{},{} @@",
        hunk.new_start,
        hunk.new_lines,
        hunk.old_start,
        hunk.old_lines
    );

    patch_text.push_str(&reversed_header);
    patch_text.push('\n');

    // Add hunk lines with reversed prefixes (+ becomes -, - becomes +)
    for line in &hunk.lines {
        let prefix = match line.line_type {
            LineType::Addition => '-',  // Reverse: addition becomes deletion
            LineType::Deletion => '+',  // Reverse: deletion becomes addition
            LineType::Context => ' ',
        };
        patch_text.push(prefix);
        patch_text.push_str(&line.content);
        if !line.content.ends_with('\n') {
            patch_text.push('\n');
        }
    }

    // Create a Diff object from the reversed patch text
    let diff = Diff::from_buffer(patch_text.as_bytes()).map_err(toe)?;

    // Apply the reversed diff to the index (unstaging)
    repo.apply(&diff, ApplyLocation::Index, None).map_err(toe)?;

    Ok(())
}
