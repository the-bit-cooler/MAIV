# 🧩 Conventional Commits Guide

This repository follows the [Conventional Commits](https://www.conventionalcommits.org/) specification to keep our commit history clean, consistent, and automation-friendly.

By using clear, structured commit messages, we can:
- 🧾 Automatically generate changelogs  
- 🧱 Automate versioning (via tools like **release-please** or **semantic-release**)  
- 🔍 Make commit history easy to read and search  
- 🤝 Improve collaboration and PR reviews  

---

## 📜 Commit Message Format

Each commit message should follow this structure:

```
<type>(optional scope): <short summary>

(optional body)

(optional footer)
```

### Example
```
feat(drawer): add custom drawer content with section headers

Refactored drawer layout to use a custom DrawerContent component.
Supports labeled section headers for grouped drawer items.
Improves navigation clarity and organization.
```

---

## 🧱 Commit Types and When to Use Them

| Type | Description | Version Bump | Example |
|------|--------------|---------------|----------|
| **feat** | A new feature or enhancement that affects users | **minor** | `feat: add offline Bible caching` |
| **fix** | A bug fix restoring intended behavior | **patch** | `fix: resolve crash when loading summaries` |
| **docs** | Documentation changes only | — | `docs: add setup guide for Azure Functions` |
| **style** | Code style or formatting (no logic change) | — | `style: reformat components using Prettier` |
| **refactor** | Code restructuring or cleanup with no behavior change | — | `refactor: extract verse mapping utility` |
| **test** | Add or update automated tests | — | `test: add unit tests for cache utilities` |
| **chore** | Maintenance tasks (deps, configs, CI) | — | `chore: bump expo-image to latest version` |
| **build** | Changes to build system or dependencies | — | `build: update EAS config for iOS profile` |
| **ci** | Continuous integration or pipeline changes | — | `ci: update GitHub Actions workflow triggers` |
| **perf** | Performance improvements | **patch** | `perf: speed up verse rendering with memoization` |
| **revert** | Revert a previous commit | — | `revert: undo custom cache logic regression` |

---

## 🧠 Choosing the Right Type

| Situation | Recommended Type | Example Commit |
|------------|------------------|----------------|
| Added a new UI feature or API endpoint | `feat` | `feat: add verse translation mode` |
| Fixed a display or logic bug | `fix` | `fix: prevent null reference on book change` |
| Added new constants or made code cleaner | `refactor` | `refactor: add shared app defaults constant` |
| Updated dependencies or configs | `chore` | `chore: update Expo SDK to 52.0` |
| Improved code performance | `perf` | `perf: optimize chapter pagination` |
| Added or updated unit/integration tests | `test` | `test: add missing cache expiration tests` |
| Changed CI/CD workflows or pipelines | `ci` | `ci: adjust release-please configuration` |

---

## 💡 Practical Tips

- **Keep commits small and focused**  
  Each commit should represent *one logical change*.
  
- **Use imperative tone**  
  ✅ `feat: add theme toggle`  
  ❌ `Added theme toggle`

- **Avoid combining types**  
  If your change adds a feature *and* fixes a bug, split them:  
  ```
  feat: add custom drawer headers
  fix: resolve crash on initial drawer load
  ```

- **Use scopes when it helps clarity**  
  Scopes describe *what part* of the project changed:  
  `feat(reader): add jump-to-verse modal`  
  `fix(cache): handle expired entries`

---

## 🧾 Example Commit Log

```
feat(drawer): add custom drawer content with section headers
fix(reader): prevent crash on missing chapter summary
refactor(cache): extract ttl constants for reusability
chore: update EAS build configuration
docs: improve local development setup section
```

Would produce this **automatically generated changelog**:

### ✨ Features
- **drawer:** add custom drawer content with section headers

### 🐛 Fixes
- **reader:** prevent crash on missing chapter summary

### ♻️ Refactors
- **cache:** extract ttl constants for reusability

### 🧰 Chores
- update EAS build configuration

### 📖 Docs
- improve local development setup section

---

## 🧩 Why It Matters

Conventional Commits make your project:
- **Automatable** — tools can bump versions and generate changelogs  
- **Readable** — history tells a story of features and fixes  
- **Maintainable** — easier debugging, clearer PRs, better context  

> 💬 *“A good commit message is like good documentation — it tells the next developer (including future you) why something changed.”*

---

## 🔗 Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [release-please GitHub Action](https://github.com/googleapis/release-please-action/)
