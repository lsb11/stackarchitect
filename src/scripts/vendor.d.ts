// Types for the two npm packages the in-browser tools import. Both are plain
// CommonJS with no bundled typings. Only what the pages use is declared.

declare module 'shopify-capi-validator' {
  export interface Finding {
    level: 'pass' | 'warn' | 'fail';
    msg: string;
    hint?: string;
  }
  export function validatePayload(
    payload: unknown,
    opts?: { platform?: 'meta' | 'tiktok' | 'auto' },
  ): { platform: string; events: { findings: Finding[] }[] };
  export function normalizeForMeta(field: string, value: string): string;
}

declare module 'apps-script-quotas' {
  export interface Limit {
    raw: string;
    value: number | null;
    unit: string | null;
    per: string | null;
    note: boolean;
    seconds?: number;
  }
  export interface Row {
    id: string;
    feature: string;
    consumer: Limit;
    workspace: Limit;
    kind: 'daily' | 'limit';
  }
  export interface Explanation {
    cause: string;
    fix: string;
    limits: { id: string; feature: string; value: string }[];
    guide: string;
    alsoSee?: string;
    named?: string;
  }
  export const quotas: Row[];
  export const limitations: Row[];
  export function get(nameOrId: string): Row | null;
  export function explain(message: string, account?: 'consumer' | 'workspace'): Explanation | null;
  export const GUIDES: Record<string, string>;
}
