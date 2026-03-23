export function makeRequest(method: string, body?: unknown, headers?: Record<string, string>) {
  return new Request('http://localhost/api/test', {
    method,
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-key', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}
