import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as esbuild from 'esbuild';

const traverse = traverseModule.default || traverseModule;
const parse = parser.parse || parser;

const BLOCKED_IDENTIFIERS = new Set([
    'eval',
    'Function',
    'fetch',
    'XMLHttpRequest',
    'process',
    'require',
    '__dirname',
    'fs',
    'setTimeout',
    'setInterval'
]);

const BLOCKED_PROPERTIES = new Set(['dangerouslySetInnerHTML']);

const MAX_BUNDLE_SIZE_KB = 50;

async function scan(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    let ast;

    try {
        ast = parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript']
        });
    } catch (err) {
        console.error(`Failed to parse ${filePath}:`, err.message);
        process.exit(1);
    }

    const errors = [];

    traverse(ast, {
        Identifier(path) {
            if (BLOCKED_IDENTIFIERS.has(path.node.name)) {
                // Check if it's a variable declaration or a property access that we might want to allow?
                // Actually, the spec says "Block globals".
                // To be safe, block any usage of these names.
                errors.push(`Blocked identifier "${path.node.name}" found at line ${path.node.loc.start.line}`);
            }
        },
        CallExpression(path) {
            if (path.node.callee.type === 'Import') {
                errors.push(`Dynamic import() is blocked at line ${path.node.loc.start.line}`);
            }
        },
        MemberExpression(path) {
            if (path.node.property.type === 'Identifier' && BLOCKED_PROPERTIES.has(path.node.property.name)) {
                errors.push(`Blocked property "${path.node.property.name}" found at line ${path.node.loc.start.line}`);
            }
        }
    });

    if (errors.length > 0) {
        console.error(`Security scan failed for ${filePath}:`);
        errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
    }

    // Bundle size check
    try {
        const result = await esbuild.build({
            entryPoints: [filePath],
            bundle: true,
            write: false,
            minify: true,
            platform: 'browser',
            format: 'esm',
            external: ['react', 'react-dom', '@og-engine/types', '@og-engine/template-base']
        });

        const bundledCode = result.outputFiles[0].contents;
        const gzipped = zlib.gzipSync(bundledCode);
        const sizeKb = gzipped.length / 1024;

        if (sizeKb > MAX_BUNDLE_SIZE_KB) {
            console.error(
                `Bundle size too large for ${filePath}: ${sizeKb.toFixed(2)}kb (max ${MAX_BUNDLE_SIZE_KB}kb)`
            );
            process.exit(1);
        }

        console.log(`Scan passed for ${filePath} (${sizeKb.toFixed(2)}kb gzipped)`);
    } catch (err) {
        console.error(`Failed to bundle ${filePath}:`, err.message);
        process.exit(1);
    }
}

const target = process.argv[2];
if (!target) {
    console.error('Usage: scan-template.mjs <file-path>');
    process.exit(1);
}

scan(target);
