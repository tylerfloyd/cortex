import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer } from './server.js';

const args = process.argv.slice(2);
const useSSE =
  process.env.MCP_TRANSPORT === 'sse' || args.includes('--sse');

async function main() {
  const server = createServer();

  if (useSSE) {
    // HTTP + SSE transport for remote access
    const port = parseInt(process.env.MCP_PORT ?? '3001', 10);

    // The MCP SDK SSEServerTransport requires an HTTP server that routes
    // POST /message to the transport and GET /sse to establish the SSE stream.
    const { createServer: createHttpServer } = await import('http');

    const transports: Map<string, SSEServerTransport> = new Map();

    const httpServer = createHttpServer(async (req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);

      if (req.method === 'GET' && url.pathname === '/sse') {
        const transport = new SSEServerTransport('/message', res);
        transports.set(transport.sessionId, transport);

        res.on('close', () => {
          transports.delete(transport.sessionId);
        });

        await server.connect(transport);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/message') {
        const sessionId = url.searchParams.get('sessionId');
        if (!sessionId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing sessionId' }));
          return;
        }

        const transport = transports.get(sessionId);
        if (!transport) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }

        await transport.handlePostMessage(req, res);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', transport: 'sse' }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    httpServer.on('error', (err) => {
      console.error('[cortex-mcp] HTTP server error:', err);
      process.exit(1);
    });

    process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
    process.on('SIGINT', () => httpServer.close(() => process.exit(0)));

    httpServer.listen(port, () => {
      console.error(`[cortex-mcp] SSE transport listening on http://localhost:${port}`);
      console.error(`[cortex-mcp]   SSE endpoint:  GET  http://localhost:${port}/sse`);
      console.error(`[cortex-mcp]   Message endpoint: POST http://localhost:${port}/message`);
    });
  } else {
    // stdio transport for local Claude Code
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[cortex-mcp] Running on stdio transport');
  }
}

main().catch((err) => {
  console.error('[cortex-mcp] Fatal error:', err);
  process.exit(1);
});
