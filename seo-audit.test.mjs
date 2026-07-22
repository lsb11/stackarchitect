import { test } from 'node:test';
import assert from 'node:assert';
import { walk } from './seo-audit.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

test('walk correctly recurses through directories', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'walk-test-'));
  try {
    // Create the following directory structure:
    // tmpDir/
    //   file1.txt
    //   dir1/
    //     file2.txt
    //     dir2/
    //       file3.txt

    fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'content 1');

    fs.mkdirSync(path.join(tmpDir, 'dir1'));
    fs.writeFileSync(path.join(tmpDir, 'dir1', 'file2.txt'), 'content 2');

    fs.mkdirSync(path.join(tmpDir, 'dir1', 'dir2'));
    fs.writeFileSync(path.join(tmpDir, 'dir1', 'dir2', 'file3.txt'), 'content 3');

    // Run the walk function
    const files = walk(tmpDir);

    // Verify it found exactly 3 files
    assert.strictEqual(files.length, 3, 'Should find exactly 3 files');

    // Verify all the expected files are in the array, using absolute paths as `walk` returns full paths based on the input dir
    assert.ok(files.includes(path.join(tmpDir, 'file1.txt')), 'Should include file1.txt');
    assert.ok(files.includes(path.join(tmpDir, 'dir1', 'file2.txt')), 'Should include dir1/file2.txt');
    assert.ok(files.includes(path.join(tmpDir, 'dir1', 'dir2', 'file3.txt')), 'Should include dir1/dir2/file3.txt');

    // Verify it did not include any directories
    assert.ok(!files.includes(path.join(tmpDir, 'dir1')), 'Should not include dir1');
    assert.ok(!files.includes(path.join(tmpDir, 'dir1', 'dir2')), 'Should not include dir1/dir2');

  } finally {
    // Clean up temporary directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('walk returns empty array for empty directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'walk-test-empty-'));
  try {
    const files = walk(tmpDir);
    assert.strictEqual(files.length, 0, 'Should return empty array for empty directory');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
