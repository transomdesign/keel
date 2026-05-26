# Contributing Guidelines

To maintain a clean and scannable project history, this repository follows a specific set of conventions for commit messages and coding styles.

## Git Commit Convention

We use a modified version of **Conventional Commits** enhanced with **Gitmojis**. Each commit message should follow this format:

`type: 👾 subject`

### Front-End Specific Prefixes

| Prefix | Gitmoji | Description |
| :--- | :--- | :--- |
| **`ui:`** | 🎨 | **`:art:`** – UI changes, Tailwind tweaks, and CSS styling. |
| **`tpl:`** | 🧱 | **`:bricks:`** – Structural changes to Twig templates or HTML. |
| **`cms:`** | 🗃️ | **`:card_file_box:`** – Craft CMS config, Project Config, or field changes. |
| **`dx:`** | 🧑‍💻 | **`:technologist:`** – Developer experience (Vite config, HMR, tooling). |
| **`types:`** | 🏷️ | **`:label:`** – TypeScript definitions, interfaces, and type updates. |
| **`assets:`** | 🍱 | **`:bento:`** – Adding/updating images, icons, or fonts. |
| **`a11y:`** | ♿ | **`:wheelchair:`** – Accessibility improvements. |
| **`perf:`** | ⚡ | **`:zap:`** – Performance optimizations. |

### Standard Prefixes
* **`feat:`** ✨ New features or logic.
* **`fix:`** 🐛 Bug fixes.
* **`refactor:`** ♻️ Code changes that neither fix a bug nor add a feature.

---

## Coding Standards

### CSS & Styling
* **BEM Maximalism:** We follow strict BEM (Block Element Modifier) naming conventions for all components to ensure style encapsulation and readability.
* **Tailwind CSS:** Use Tailwind utility classes within Twig templates. For complex components, use `@apply` within CSS files following BEM naming.
* **Nesting:** Native CSS nesting is encouraged for readability within BEM blocks.

### TypeScript
* Maintain strict typing wherever possible.
* Place shared interfaces and types in the `types/` directory using the `types:` prefix for any updates.

### Craft CMS
* Always commit changes to the `config/project/` directory.
* Use the `cms:` prefix when modifying field handles, sections, or global sets.
