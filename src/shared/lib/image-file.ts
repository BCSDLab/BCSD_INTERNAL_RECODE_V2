/** Shared size and extension validation; callers choose whether SVG is allowed. */
export function validateImageFile(file: Pick<File, 'name' | 'size'>, allowSvg = false): string | null {
  const extensions = ['png', 'jpg', 'jpeg', 'webp', ...(allowSvg ? ['svg'] : [])];
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !extensions.includes(extension)) {
    return `허용되지 않는 확장자입니다 (${extensions.join(', ')}만 가능).`;
  }
  return file.size > 5 * 1024 * 1024 ? '5MB를 초과하는 파일은 올릴 수 없습니다.' : null;
}
