/**
 * @file generate-preview.mjs
 * @description Generates 1200x630 preview images for templates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use dynamic imports to handle potential path shifts in dist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function getModules() {
    // Try nested dist (from root-based tsc build) or local src (via tsx if we were using it)
    const paths = [
        '../packages/adapter-node/dist/packages/adapter-node/src/index.js',
        '../packages/adapter-node/dist/index.js'
    ];
    
    for (const p of paths) {
        try {
            const adapter = await import(p);
            const core = await import('../packages/core/dist/render.js');
            const fonts = await import('../packages/core/dist/fonts.js');
            return { nodeAdapter: adapter.nodeAdapter, render: core.render, getDefaultFonts: fonts.getDefaultFonts };
        } catch (e) {
            continue;
        }
    }
    throw new Error('Could not load og-engine modules. Ensure they are built: pnpm build');
}

async function generate(templateId, modules) {
    const { nodeAdapter, render, getDefaultFonts } = modules;
    const adapter = nodeAdapter();
    const template = await adapter.registry.get(templateId);

    if (!template) {
        throw new Error(`Template ${templateId} not found in registry`);
    }

    console.log(`📸 Generating preview for: ${templateId}`);

    const params = {};
    for (const [key, field] of Object.entries(template.schema)) {
        const f = field;
        if ('default' in f && f.default !== undefined) {
            params[key] = String(f.default);
        } else if (f.type === 'string' || f.type === 'text') {
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

    const tiers = ['free', 'pro'];
    let outPath = '';
    
    for (const tier of tiers) {
        const potentialPath = path.join(rootDir, 'templates', tier, `${templateId}.tsx`);
        if (fs.existsSync(potentialPath)) {
            outPath = path.join(rootDir, 'templates', tier, `${templateId}.preview.png`);
            break;
        }
    }

    if (!outPath) {
        throw new Error(`Template source file not found for ${templateId}`);
    }

    fs.writeFileSync(outPath, result.buffer);
    console.log(`✅ Success: ${outPath}`);
}

async function main() {
    const arg = process.argv[2];
    if (!arg) {
        console.error('Usage: node scripts/generate-preview.mjs <template-id | all>');
        process.exit(1);
    }

    const modules = await getModules();

    if (arg === 'all') {
        const adapter = modules.nodeAdapter();
        const templates = await adapter.registry.list();
        for (const t of templates) {
            try {
                await generate(t.id, modules);
            } catch (err) {
                console.error(`❌ Failed to generate ${t.id}:`, err.message);
            }
        }
    } else {
        await generate(arg, modules);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
