# Contributing to og-engine 🤝

First off, thank you for considering contributing to `og-engine`! It's people like you who make this project great.

## 🎨 Adding a New Template

Templates are the heart of `og-engine`. Here is how you can build and submit your own.

### 1. Structure
Create a new directory in `templates/`:
```
templates/my-template/
├── index.tsx       # Main template logic
├── package.json    # Metadata
├── tsconfig.json   # Local types
└── preview.png     # Generated preview (1200x630)
```

### 2. The Template Contract
Your template must export an object conforming to the `OGTemplate` interface:

```typescript
import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'my-template',
  name: 'My Template',
  description: 'A brief description',
  author: 'Your GitHub Username',
  version: '1.0.0',
  tags: ['minimal', 'post'],
  supportedSizes: ['twitter-og', 'ig-post'],
  schema: {
    title: { type: 'string', required: true, maxLength: 80 },
    color: { type: 'color', default: '#ff0000' }
  },
  render: (params) => {
    return (
      <div style={{ background: params.color, width: '100%', height: '100%' }}>
        {params.title}
      </div>
    );
  }
};

export default template;
```

### 3. Satori CSS Limitations
`og-engine` uses Satori for rendering. Satori only supports a subset of CSS:
- ✅ Flexbox (mostly)
- ✅ Absolute positioning
- ✅ Fonts, Colors, Borders, Opacity
- ❌ CSS Grid
- ❌ Advanced Selectors (`:hover`, `:nth-child`)
- ❌ Most CSS filters

### 4. Verification
Before opening a PR, run these commands:
```bash
# Verify your template passes the security scan
pnpm template:scan

# Verify rendering and performance
pnpm template:test

# Generate your preview image
pnpm template:preview --id my-template
```

## 🛠️ Code Standards

- **Type Safety**: Never use `any`. Use `unknown` with type guards if necessary.
- **Documentation**: All exported symbols must have JSDoc comments.
- **Linting**: Run `pnpm lint` before committing.
- **Errors**: Throw `OGEngineError` for handled exceptions.

## 🐛 Bug Reports

If you've found a bug, please open an issue and include:
- A clear description of the bug.
- Steps to reproduce the behavior.
- The environment (Node version, OS, Adapter used).
- Any relevant logs or screenshots.

---

Thank you for contributing! 🚀
