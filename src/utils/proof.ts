/**
 * proof.ts — build-time facts about the screenshots in public/proof/.
 *
 * WHY A MISSING FILE IS NOT A BUILD ERROR
 * These assets are captured by hand and land in the repo one at a time. The
 * page they sit on asks a stranger for card details, so a broken image icon or
 * an empty bordered box is worse than no section at all. The rule this module
 * encodes: if the file is there, render it; if it is not, render the frame in
 * `astro dev` — where it is a visible reminder that the layout is waiting on an
 * asset — and render nothing at all in a production build.
 *
 * WHY THE DIMENSIONS ARE READ RATHER THAN DECLARED
 * `width`/`height` on the <img> exist to reserve the right box before the image
 * decodes; a declared aspect that does not match the file causes exactly the
 * layout shift the attributes are there to prevent. A PNG states its own size
 * in the IHDR chunk, 16 bytes in, so there is no reason to hand-maintain a
 * number that the file already knows. The declared values in
 * src/data/proofShots.ts are a fallback for the file-absent case only.
 */
import { openSync, readSync, closeSync, statSync } from 'node:fs';
import path from 'node:path';
import type { ProofShot } from '../data/proofShots';

const PROOF_DIR = path.join(process.cwd(), 'public', 'proof');

/** PNG signature, first 8 bytes of any valid PNG. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface ResolvedShot {
  /** Site-absolute src, e.g. /proof/scenario-capi-shield.png */
  src: string;
  alt: string;
  /** Caption with the capture date appended when one is known. */
  caption: string;
  width: number;
  height: number;
  /** True when the file is on disk and was measured. */
  present: boolean;
  /** True when the frame should appear at all: present, or `astro dev`. */
  visible: boolean;
  /** Dev-only note naming what is missing. Empty when nothing is. */
  pending: string;
}

/**
 * Read a PNG's real pixel dimensions from its IHDR chunk.
 * Returns null for a missing file or anything that is not a PNG.
 */
function pngSize(file: string): { width: number; height: number } | null {
  let fd: number | undefined;
  try {
    fd = openSync(file, 'r');
    const header = Buffer.alloc(24);
    if (readSync(fd, header, 0, 24, 0) < 24) return null;
    if (!header.subarray(0, 8).equals(PNG_MAGIC)) return null;
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** "27 Aug 2026" — the short form used everywhere else on the site. */
function shortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Resolve one declared shot against what is actually on disk.
 *
 * The capture date comes from `shot.captured` when it is pinned, and otherwise
 * from the file's mtime — correct for a screenshot saved straight into the
 * repo, wrong for one copied in weeks later, which is why pinning it is the
 * documented practice. With neither, the caption carries no date rather than an
 * invented one.
 */
export function resolveShot(shot: ProofShot): ResolvedShot {
  const abs = path.join(PROOF_DIR, shot.file);
  const size = pngSize(abs);
  const present = size !== null;

  let captured = shot.captured;
  if (!captured && present) {
    try {
      captured = shortDate(statSync(abs).mtime);
    } catch {
      /* unreadable mtime is not worth failing a build over */
    }
  }

  return {
    src: `/proof/${shot.file}`,
    alt: shot.alt,
    caption: captured ? `${shot.caption} Captured ${captured}.` : shot.caption,
    width: size?.width ?? shot.width,
    height: size?.height ?? shot.height,
    present,
    visible: present || import.meta.env.DEV,
    pending: present
      ? shot.captured
        ? ''
        : `proof/${shot.file} — capture date is the file mtime; pin it in proofShots.ts`
      : `proof/${shot.file} — screenshot pending`,
  };
}

/** Resolve several shots, dropping the ones that should not render at all. */
export function resolveShots(shots: (ProofShot | undefined)[]): ResolvedShot[] {
  return shots
    .filter((s): s is ProofShot => s !== undefined)
    .map(resolveShot)
    .filter((s) => s.visible);
}
