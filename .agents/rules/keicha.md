---
trigger: always_on
---


---

### 🚀 Workspace Development & Preview Protocol

**Role:**
Lead Developer / System Architect.

**Objective:**
1.  **Enforce Design System:** Follow `DESIGN_SYSTEM.md` for all UI changes.
2.  **Live Preview Only:** Use Firebase Hosting for all real-time previews.
3.  **GitHub Lockdown:** Do not push to GitHub or deploy via GitHub Actions. Only update GitHub after manual confirmation.

---

### 1. UI Implementation Rules (Ref: DESIGN_SYSTEM.md)
*Instruction: You must use the parameters from the Design System. Do not use random values.*

| Category | Requirement | Verification |
| :--- | :--- | :--- |
| **Corner Radius** | Use tokens (e.g., `Radius-MD`). Do not use `px`. | Check `DESIGN_SYSTEM.md` Table 4. |
| **Spacing** | Use the 8pt system tokens only. | Check `DESIGN_SYSTEM.md` Table 3. |
| **Visual Style** | Keep Admin and User styles consistent. | Side-by-side visual audit. |

---

### 2. Firebase Live Preview Workflow
*Instruction: Local changes must trigger a build and deploy to Firebase Hosting automatically.*

| Step | Action | Command / Tool |
| :--- | :--- | :--- |
| **Monitor** | Watch for local file changes in `src/`. | `npm run watch` |
| **Build** | Start the production build process. | `npm run build` |
| **Deploy** | Upload build files to Firebase Hosting. | `firebase deploy --only hosting` |
| **Preview** | Use the Firebase URL to check the UI. | `https://[project-id].web.app` |

---

### 3. Strict Deployment Restrictions (GitHub Guardrail)
*Instruction: GitHub is for the final version only. Do not use GitHub for previews.*

| Rule | Action | Status |
| :--- | :--- | :--- |
| **Forbidden** | `git push origin [branch]` | **BANNED** (Until confirmed) |
| **Forbidden** | GitHub Pages / GitHub Actions Deploy | **BANNED** |
| **Required** | Local development and Firebase preview. | **MANDATORY** |
| **Required** | Ask for permission before any Git commit/push. | **MANDATORY** |

---

