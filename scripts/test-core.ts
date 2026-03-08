/**
 * @file test-core.ts
 * @description Manual test runner for the core rendering engine.
 * 
 * This script bypasses the full HTTP handler and tests the render pipeline
 * directly using the Node.js adapter and built-in templates.
 * 
 * Usage:
 *   npx tsx scripts/test-core.ts <template-id>
 */
import { nodeAdapter } from '../packages/adapter-node/src/index.js';
import { render } from '../packages/core/src/render.js';
import { getDefaultFonts } from '../packages/core/src/fonts.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function main() {
    const templateId = process.argv[2] || 'sunset';
    console.log(`🚀 Testing core render for: ${templateId}`);

    try {
        const adapter = nodeAdapter();
        const template = await adapter.registry.get(templateId);

        if (!template) {
            console.error(`❌ Template not found: ${templateId}`);
            const available = await adapter.registry.list();
            console.log(`Available templates: ${available.map(t => t.id).join(', ')}`);
            process.exit(1);
        }

        console.log('📦 Loading fonts...');
        const fonts = await getDefaultFonts();
        console.log(`✅ Loaded ${fonts.length} fonts`);

        // Build parameters from schema defaults
        const params: Record<string, string> = {};
        for (const [key, field] of Object.entries(template.schema)) {
            const f = field as any;
            if (f.default !== undefined) {
                params[key] = String(f.default);
            } else if (f.required) {
                params[key] = f.type === 'color' ? '#e8a020' : `Sample ${key}`;
            }
        }

        console.log('🎨 Rendering...');
        const start = performance.now();
        const result = await render(
            {
                template: templateId,
                size: 'og',
                params
            },
            template,
            fonts
        );
        const end = performance.now();

        const outDir = path.join(rootDir, '.temp');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        const outPath = path.join(outDir, `${templateId}-test.png`);
        fs.writeFileSync(outPath, result.buffer);

        console.log(`\n✨ Success!`);
        console.log(`⏱️  Time: ${(end - start).toFixed(2)}ms`);
        console.log(`📂 Output: ${outPath}`);

    } catch (err) {
        console.error(`\n❌ Render failed:`);
        console.error(err);
        process.exit(1);
    }
}

main();
