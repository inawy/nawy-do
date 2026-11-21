import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fs = vi.hoisted(() => ({ writeFile: vi.fn() }));
const share = vi.hoisted(() => ({ share: vi.fn() }));
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: fs,
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}));
vi.mock('@capacitor/share', () => ({ Share: share }));

import { canShareFile, canShareText, downloadText, shareText, shareTextOnly } from '@/app/files';
import { shareNativeFile, shareNativeText } from '@/app/native/share';

const native = (on: boolean) => {
  const w = window as unknown as Record<string, unknown>;
  if (on) w.Capacitor = { isNativePlatform: () => true };
  else delete w.Capacitor;
};

beforeEach(() => {
  vi.clearAllMocks();
  fs.writeFile.mockResolvedValue({ uri: 'file:///cache/b.json' });
  share.share.mockResolvedValue({});
});
afterEach(() => native(false));

describe('native share', () => {
  it('writes the file to the cache and shares its uri', async () => {
    expect(await shareNativeFile('b.json', '{"a":1}')).toBe(true);
    expect(fs.writeFile).toHaveBeenCalledWith({
      path: 'b.json',
      data: '{"a":1}',
      directory: 'CACHE',
      encoding: 'utf8',
    });
    expect(share.share).toHaveBeenCalledWith({ title: 'b.json', files: ['file:///cache/b.json'] });
  });
  it('says false when the person cancels or a plugin fails', async () => {
    share.share.mockRejectedValue(new Error('Share canceled'));
    expect(await shareNativeFile('b.json', '{}')).toBe(false);
    expect(await shareNativeText('t', 'x')).toBe(false);
  });
  it('shares plain text', async () => {
    expect(await shareNativeText('عنوان', 'نص')).toBe(true);
    expect(share.share).toHaveBeenCalledWith({ title: 'عنوان', text: 'نص' });
  });
});

describe('file helpers inside the Android app', () => {
  it('route download and share through the share sheet', async () => {
    native(true);
    expect(canShareFile()).toBe(true);
    expect(canShareText()).toBe(true);
    downloadText('b.json', '{}');
    await vi.waitFor(() => expect(share.share).toHaveBeenCalledOnce());
    expect(await shareText('c.json', '{}')).toBe(true);
    expect(await shareTextOnly('t', 'x')).toBe(true);
  });
  it('leave the browser path alone', () => {
    native(false);
    expect(canShareText()).toBe(typeof navigator.share === 'function');
    expect(share.share).not.toHaveBeenCalled();
  });
});
