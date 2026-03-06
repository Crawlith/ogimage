import fs from 'node:fs';
import path from 'node:path';
import { nodeAdapter } from '../packages/adapter-node/dist/index.js';
import { render } from '../packages/core/dist/render.js';
import { getDefaultFonts } from '../packages/core/dist/fonts.js';

async function test(templateId) {
    const adapter = nodeAdapter();
    const template = await adapter.registry.get(templateId);

    const params = {};
    for (const [key, field] of Object.entries(template.schema)) {
        if ('default' in field) params[key] = String(field.default);
        else if (field.type === 'string' || field.type === 'text') params[key] = `Sample ${key}`;
    }

    const fonts = await getDefaultFonts();
    const tempDir = path.join(process.cwd(), '.temp', 'previews');
    fs.mkdirSync(tempDir, { recursive: true });

    console.log(`Testing template: ${templateId}`);

    for (const size of template.supportedSizes) {
        const start = performance.now();
        const result = await render(
            {
                template: templateId,
                size,
                params
            },
            template,
            fonts
        );
        const end = performance.now();
        const duration = end - start;

        const outPath = path.join(tempDir, `${templateId}-${size}.png`);
        fs.writeFileSync(outPath, result.buffer);
        console.log(`  - ${size}: ${duration.toFixed(2)}ms -> ${outPath}`);

        if (duration > 50) {
            console.warn(`    ⚠️ Warning: Render time exceeds 50ms limit`);
        }
    }
}

const id = process.argv[2];
if (!id) {
    console.error('Usage: node scripts/render-test.mjs <template-id>');
    process.exit(1);
}

test(id).catch(err => {
    console.error(err);
    process.exit(1);
});
