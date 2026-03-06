import fs from 'node:fs';
import path from 'node:path';
import { nodeAdapter } from '../packages/adapter-node/dist/index.js';
import { render } from '../packages/core/dist/render.js';
import { getDefaultFonts } from '../packages/core/dist/fonts.js';

async function generate(templateId) {
    const adapter = nodeAdapter();
    const template = await adapter.registry.get(templateId);

    // Build dummy params from schema defaults
    const params = {};
    for (const [key, field] of Object.entries(template.schema)) {
        if ('default' in field) {
            params[key] = String(field.default);
        } else if (field.type === 'string' || field.type === 'text') {
            params[key] = `Sample ${key}`;
        }
    }

    const fonts = await getDefaultFonts();
    const result = await render(
        {
            template: templateId,
            size: 'og',
            params
        },
        template,
        fonts
    );

    const outPath = path.join(process.cwd(), 'templates', templateId, 'preview.png');
    fs.writeFileSync(outPath, result.buffer);
    console.log(`Generated preview for ${templateId} at ${outPath}`);
}

const id = process.argv[2];
if (!id) {
    console.error('Usage: node scripts/generate-preview.mjs <template-id>');
    process.exit(1);
}

generate(id).catch(err => {
    console.error(err);
    process.exit(1);
});
