export function formatSSE(event: string, data: Record<string, any>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}