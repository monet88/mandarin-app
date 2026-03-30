# AGENTS

## Smart Code

Use this workflow for architecture exploration, debugging, feature-flow tracing, and refactor impact analysis before non-trivial code changes.

### System Roles

- `mcp__codebase-memory-mcp__*`: architecture, graph search, call paths, and blast radius
- `mcp__ck-search__*`: semantic, regex, and lexical code search

### Index Readiness

1. `mcp__ck-search__reindex(path="<repo-root>")`
2. `mcp__codebase-memory-mcp__index_repository(repo_path="<repo-root>")`

Verify readiness with:

- `mcp__ck-search__index_status(path="<repo-root>")`
- `mcp__codebase-memory-mcp__index_status(project="<project-name>")`

### 3-Phase Workflow

#### Phase 1: Recall Context

1. `mcp__codebase-memory-mcp__get_architecture(aspects=["packages","hotspots","routes","boundaries"])`
2. Skip only for trivial symbol lookup with no architecture impact.

#### Phase 2: Locate Targets

1. Use `mcp__ck-search__semantic_search(...)` or `mcp__ck-search__hybrid_search(...)` when the behavior or function name is unknown.
2. Use `mcp__ck-search__regex_search(...)` or `mcp__ck-search__lexical_search(...)` when the symbol or error text is known.
3. Use `mcp__codebase-memory-mcp__get_code_snippet(...)` when the exact symbol is known.
4. Otherwise use targeted reads with `functions.shell_command`.
5. Do not dump entire large files unless targeted search failed.

#### Phase 3: Trace and Assess Impact

1. Start with `mcp__codebase-memory-mcp__trace_call_path(function_name="<exact-name>", direction="both", depth=2)`.
2. Increase `depth` only if needed.
3. Use `mcp__codebase-memory-mcp__search_graph(...)` to resolve exact names or nearby modules.
4. Before risky edits or refactors, run `mcp__codebase-memory-mcp__detect_changes(scope="all")`.
5. Use `scope="branch"` with `base_branch="main"` when comparing branch impact.
6. If blast radius includes `HIGH` or `CRITICAL`, surface it before editing.

### Execution Policy

- Default path: `Recall -> Locate -> Trace`
- Fast path: `Locate only` for trivial lookup
- Debug path: all 3 phases are mandatory
- Pre-refactor path: `Recall -> Trace`

### Guardrails

- Search first, trace second, edit last.
- Keep reads narrow and evidence-based.
- Do not claim impact without graph or call-path support.
- Do not expose secrets or credentials in reports.

### Minimal Output Template

1. `Context recalled`: prior decisions or issues relevant to the request
2. `Location found`: concrete files or symbols discovered
3. `Impact`: callers, callees, and blast radius summary
4. `Recommendation`: safest next step
