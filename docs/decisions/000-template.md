# ADR-000: [Short Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** [Names/Roles]
**Context:** [Link to related issue/discussion]

---

## Context and Problem Statement

[Describe the context and the problem that needs to be solved. What is the technical or product challenge? Why does this decision need to be made now?]

**Example:**
We need to decide between using shell `git` commands vs libgit2 (git2 Rust crate) for all git operations. This affects performance, error handling, and implementation complexity.

---

## Decision Drivers

- [Driver 1: e.g., Performance requirements (<100ms for status)]
- [Driver 2: e.g., Error handling (need structured errors, not shell text parsing)]
- [Driver 3: e.g., Cross-platform support (Windows, macOS, Linux)]
- [Driver 4: e.g., Developer experience (type safety, async support)]

---

## Considered Options

### Option 1: [Name]
**Description:** [Brief description of the option]

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Example:**
### Option 1: Use shell `git` commands via Tauri's shell plugin
- **Pros:** Simple, no additional dependencies, supports all git features
- **Cons:** Slower, harder to parse output, error handling is text-based

### Option 2: [Name]
[Same structure as Option 1]

### Option 3: [Name]
[Same structure as Option 1]

---

## Decision Outcome

**Chosen Option:** [Option X: Name]

**Rationale:**
[Explain why this option was chosen. How does it address the decision drivers? What trade-offs were considered?]

**Example:**
Chose libgit2 (git2 crate) because:
1. Performance: Direct API calls are 5-10x faster than shell spawning
2. Structured errors: git2::Error provides error codes, not text parsing
3. Type safety: Rust types for all git objects (Commit, Branch, etc.)
4. Trade-off: Some advanced git features (e.g., worktrees) require fallback to shell git

---

## Consequences

### Positive
- [Positive consequence 1]
- [Positive consequence 2]

### Negative
- [Negative consequence 1]
- [Negative consequence 2]

### Neutral
- [Neutral consequence 1]

**Example:**
**Positive:**
- Status/diff operations are <50ms (meets performance targets)
- Errors are user-friendly and recoverable

**Negative:**
- git2 crate adds ~2MB to binary size
- Some git features require shell fallback (complexity)

**Neutral:**
- Team needs to learn libgit2 API (well-documented)

---

## Implementation Notes

[Any specific implementation details, code patterns, or gotchas to be aware of]

**Example:**
- libgit2 is NOT thread-safe: wrap Repository in Arc<Mutex<>> or open/close per IPC command
- Set libgit2 limits: max tree depth 1000, max blob size 100MB for diffs
- Credential callbacks are complex: see CLAUDE.md Section 21 for patterns

---

## Related Decisions

- [ADR-001: Choice of React vs Vue]
- [ADR-002: State management (Zustand vs Redux)]

---

## References

- [Link to relevant documentation]
- [Link to benchmark results]
- [Link to discussions/issues]

**Example:**
- git2 crate docs: https://docs.rs/git2
- Performance benchmarks: [internal doc link]
- Discussion: Issue #42
