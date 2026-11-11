/** Both pets use the site's existing chat contract and model configuration. */
export async function requestPetReply(message: string): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Pet chat request failed');
  const data = await response.json();
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Empty pet chat reply');
  return data.reply;
}
