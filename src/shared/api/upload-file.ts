/** Presigned uploads must not carry application authorization or cookies. */
export async function uploadFile(url: string, file: File, errorMessage: string): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    credentials: 'omit',
    body: file,
  });
  if (!response.ok) throw new Error(errorMessage);
}
