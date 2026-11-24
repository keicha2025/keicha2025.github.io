---
trigger: always_on
---

# KEICHA repository working rules

These instructions apply to all work in this repository.

## Client-side implementation and review

For frontend changes, meet the requested behavior with the least structure and JavaScript that remains clear and maintainable. Prefer native HTML5 semantics and built-in browser interactions before adding custom markup or scripting.

- Use semantic elements according to their purpose (`<main>`, `<nav>`, `<section>`, `<article>`, headings, lists, and form labels). Keep heading levels and landmarks meaningful.
- Prefer native controls and interaction elements, including links, buttons, form inputs, `<details>`/`<summary>`, and built-in validation. Do not recreate browser behavior in JavaScript when native HTML already meets the requirement.
- Add JavaScript only for behavior or data handling HTML and CSS cannot provide. Avoid duplicate state, unnecessary event handlers, polling, and parallel implementations of existing helpers.
- Keep repeated UI and behavior modular: reuse existing layouts, includes, CSS, and JavaScript modules where appropriate. Keep content/data separate from presentation when it is generated dynamically, and render dynamic content through focused, reusable functions.
- Use modern CSS for layout, responsiveness, visual states, and progressive enhancement so the DOM does not need wrapper elements or script-driven styling without a clear reason. Prefer existing design tokens and component styles.
- Preserve keyboard access, visible focus, accessible names, labels, and sensible behavior when JavaScript or remote data is unavailable.

During client-side review, remove redundant wrappers, duplicated rules, and unnecessary scripts when safe; check semantic structure, keyboard use, responsive behavior, and graceful handling of dynamic content. Keep the change scoped and preserve established page behavior.

## Change workflow

1. Inspect the relevant source, repository instructions, and current Git status before editing.
2. Keep changes focused on the requested task. Preserve unrelated user changes and do not overwrite files blindly.
3. After editing, review the complete diff for correctness, accidental changes, and exposed secrets. Run the checks relevant to the change and report their actual results.
4. For changes that are ready to publish, commit the intended files and push them to `main` on GitHub. Pushes must always target `main`, regardless of the local working branch. Do not include unrelated or pre-existing changes in the commit. If the branch, repository state, or remote history makes a safe push uncertain, stop before pushing and explain the blocker.

5. Keep the local and remote repositories synchronized. Before making changes, fetch the remote and check for divergence; after each completed change, commit and push the intended files to `main`, then verify that the local and remote `main` point to the same commit. Do not leave completed commits only locally; if synchronization is blocked, report the exact blocker and next step.

Example:

```bash
git add README.md .agents/rules/AGENTS.md CHANGELOG.md
git commit -m "docs: update project guidance"
git fetch origin
git rebase origin/main
git push origin HEAD:main
```

Replace the staged paths and commit message with the intended changes. Resolve any rebase conflicts before pushing.

## Deployment requirements

After pushing a change, complete both deployment paths:

- Confirm the GitHub Actions workflow for the pushed commit completes successfully.
- Deploy Firebase Hosting to `https://keicha-membership-system.web.app` using the repository's documented deployment procedure, then verify the deployment result.

Use the deployment commands and credentials already configured for this repository. Never print, commit, or place credentials in source files or logs. Do not claim a deployment succeeded based only on a started command, a queued workflow, or a successful local build; check the final workflow and deployment results.

If a required credential, permission, service, or deployment tool is unavailable, finish the safe local checks and any authorized Git push that can be completed, then clearly report which deployment step is blocked and what is needed to unblock it. Do not fabricate a successful deployment or silently omit a required deployment step.

## Reporting

Summarize the files changed, relevant checks and their outcomes, the commit and branch when pushed, and the verified GitHub Actions and Firebase Hosting deployment status. Distinguish completed work from pending or blocked steps.
