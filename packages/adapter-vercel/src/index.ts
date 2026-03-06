import { nodeAdapter, type NodeAdapterOptions } from '@og-engine/adapter-node';
import type { PlatformAdapter } from '@og-engine/types';

export type VercelAdapterOptions = NodeAdapterOptions;

export function vercelAdapter(options: VercelAdapterOptions = {}): PlatformAdapter {
  return nodeAdapter(options);
}
