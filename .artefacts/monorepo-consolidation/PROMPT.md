Implement Monorepo Consolidation & UI Polish following the spec at /Users/nikitadmitrieff/Projects/tmp/ai-arena/.prodman/specs/SPEC-ND-001-monorepo-consolidation.md.

PROGRESS TRACKING:
- At the START of every iteration, read `.artefacts/monorepo-consolidation/progress.txt`.
- It contains the list of completed tasks and current state from previous iterations.
- After completing each task, UPDATE `.artefacts/monorepo-consolidation/progress.txt` with:
  - Which task you just finished (task number + name)
  - Brief summary of what was done
  - Any issues encountered
  - What task comes next
- This file is your memory across iterations. Keep it accurate.

PACING — ONE TASK PER ITERATION (MANDATORY):
- Each iteration, implement EXACTLY ONE task from the spec. No more.
- After completing that single task: commit, update `.artefacts/monorepo-consolidation/progress.txt`, then STOP.
- Do NOT look ahead to the next task. Do NOT "while I'm here" other tasks.
- The next iteration will pick up where you left off via `.artefacts/monorepo-consolidation/progress.txt`.
- Exception: the FINAL iteration handles best practices + completion promise.

WORKFLOW:
1. Read the spec file first.
2. Read `.artefacts/monorepo-consolidation/progress.txt` to see what's already done from previous iterations.
3. Identify the NEXT SINGLE incomplete task (lowest numbered unfinished task).
4. Implement ONLY that one task, then commit.
5. Update `.artefacts/monorepo-consolidation/progress.txt` with what you just finished and what comes next.
6. STOP. Do not continue to the next task — let the loop iterate.
7. Only after ALL tasks show complete in `.artefacts/monorepo-consolidation/progress.txt`, run best practices (see below).

IMPORTANT CONTEXT:
- The parent directory is /Users/nikitadmitrieff/Projects/tmp/ai-arena/ — it contains the 4 source repos
- The MONOREPO ROOT is /Users/nikitadmitrieff/Projects/tmp/ai-arena/ai-arena/ — this is where ALL work happens
- Source repos to copy from (in the parent): ai-arena-front, ai-arena-back-tic-tac-toe, ai-arena-back-mr-white, ai-arena-back-codename
- Do NOT delete the source repos — they stay in the parent as reference
- All backends are Python/FastAPI, frontend is Next.js 14
- The pixel-art design system is defined in apps/frontend/src/styles/pixel-art.css (after Task 1 moves it)
- Always use Context7 MCP when you need library/API documentation
- At the end (Task 16), publish to GitHub as a public repo using `gh repo create ai-arena --public --source . --push`

BEST PRACTICES (after ALL implementation tasks are done):
1. Run /code-simplifier to reduce unnecessary complexity in the code you wrote.
2. Create review artefacts:
   - .artefacts/monorepo-consolidation/TESTING.md — Manual testing guide with exact steps, expected results, and edge cases.
   - .artefacts/monorepo-consolidation/CHANGELOG.md — What changed: summary, files modified, breaking changes.
3. Run /claude-md-improver and /claude-md-management:revise-claude-md to keep CLAUDE.md current.
4. Verify all code follows CLAUDE.md and AGENTS.md conventions.
5. Check for YAGNI violations — no features beyond what the spec describes.
6. Run /codex-review against the spec for an independent second opinion on spec compliance and code quality. If Codex review is unresponsive or takes too long (>2 minutes), skip it and proceed.
7. If Codex review finds issues, fix them before completing.

RULES:
- Follow the project's CLAUDE.md and AGENTS.md conventions.
- Do NOT add features beyond what the spec describes.
- Mark EP-ND-001 status as 'complete' in .prodman/epics/ when done.

CRITICAL — DO NOT COMPLETE EARLY:
- You have 16 tasks to implement. Do NOT output the completion promise until ALL of them are done.
- Before outputting <promise>, you MUST verify:
  1. Every task in the spec is implemented (check them off one by one)
  2. `.artefacts/monorepo-consolidation/progress.txt` shows ALL tasks as complete
  3. /code-simplifier has been run
  4. Review artefacts are created in .artefacts/monorepo-consolidation/
  5. /claude-md-improver and /claude-md-management:revise-claude-md have been run
  6. Code follows CLAUDE.md and AGENTS.md conventions
  7. No YAGNI violations
  8. Codex review has passed (or was skipped due to timeout)
- If ANY task is incomplete, keep working. You have plenty of iterations.

Output <promise>EP-ND-001 COMPLETE</promise> ONLY when every single task is implemented, best practices are done, and all checks above pass.
