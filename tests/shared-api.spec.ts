import { expect, test } from '@playwright/test';

import { ApiError, getApiErrorMessage } from '../src/shared/api/error';
import { uploadFile } from '../src/shared/api/upload-file';
import { validateImageFile } from '../src/shared/lib/image-file';

test('image validation preserves the size boundary and caller-specific SVG policy', () => {
  expect(validateImageFile({ name: 'PHOTO.JPG', size: 5 * 1024 * 1024 })).toBeNull();
  expect(validateImageFile({ name: 'photo.jpg', size: 5 * 1024 * 1024 + 1 })).toContain('5MB');
  expect(validateImageFile({ name: 'photo.svg', size: 100 })).toContain('허용되지');
  expect(validateImageFile({ name: 'photo.svg', size: 100 }, true)).toBeNull();
  expect(validateImageFile({ name: 'photo.exe', size: 100 }, true)).toContain('허용되지');
});

test('only API errors expose their message to the UI', () => {
  expect(getApiErrorMessage(new ApiError(409, '중복입니다.'), '실패')).toBe('중복입니다.');
  expect(getApiErrorMessage(new Error('internal detail'), '실패')).toBe('실패');
  expect(getApiErrorMessage(null, '실패')).toBe('실패');
});

test('presigned upload omits credentials and authorization and reports storage failures', async () => {
  const originalFetch = globalThis.fetch;
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  const calls: RequestInit[] = [];
  globalThis.fetch = async (_input, init) => {
    calls.push(init ?? {});
    return new Response(null, { status: calls.length === 1 ? 200 : 403 });
  };
  try {
    await uploadFile('https://storage.example/upload', file, '업로드 실패');
    expect(calls[0]).toEqual({
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      credentials: 'omit',
      body: file,
    });
    await expect(uploadFile('https://storage.example/upload', file, '업로드 실패')).rejects.toThrow('업로드 실패');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
