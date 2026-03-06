# Contributing Templates to og-engine

Thank you for wanting to contribute! og-engine is designed to be easily extensible with new templates.

## Local Setup

1. Fork and clone the repository.
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm dev`
4. Visit `http://localhost:3000` to see the editor.

## Create a New Template

Templates live in the `templates/` directory.

1. Create a new directory: `templates/my-template`
2. Create `metadata.json`:
   ```json
   {
     "id": "my-template",
     "name": "My Template",
     "description": "A beautiful new template",
     "author": "Your Name",
     "version": "1.0.0",
     "schema": {
       "title": { "type": "string", "required": true }
     },
     "supportedSizes": ["twitter-og", "og"]
   }
   ```
3. Create `index.tsx`:
   ```tsx
   import { OGTemplate } from '@og-engine/types';

   const template: OGTemplate = {
     // ... implement render function returning JSX
   };
   export default template;
   ```

## Satori CSS Limitations

Since we use Satori for rendering, there are some CSS limitations:
- Use `display: flex` — CSS Grid is not supported.
- No `position: fixed` or `position: sticky`.
- No `calc()` or `background-clip: text`.
- All dimensions must be explicit (no `auto` heights on flex children).

## Security & Performance

Before submitting:
1. Run `pnpm template:scan templates/my-template/index.tsx`
   - No `eval`, `fetch`, or filesystem access allowed.
   - Bundle size must be < 50kb gzipped.
2. Run `pnpm template:test my-template`
   - Render time must be < 50ms.

## Generating Preview

Run the following to generate the `preview.png` for the gallery:
```bash
pnpm template:preview --id my-template
```
