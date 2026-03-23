# MCP Server

The Cortex MCP (Model Context Protocol) server exposes your knowledge base to Claude Code and other MCP-compatible AI assistants. Once configured, Claude can search, retrieve, and query your saved knowledge directly within a conversation.

## What It Does

The MCP server connects to your running Cortex instance via its API and provides five tools:

- Search items by semantic similarity
- Retrieve a specific item by ID or URL
- List categories with item counts
- List recently saved items
- Ask a natural language question (RAG)

This means you can ask Claude things like "what do my notes say about container orchestration?" and get answers grounded in your actual saved content.

---

## Setup with Claude Code

### 1. Build the MCP server

```bash
cd mcp-server
npm install
npm run build
```

This compiles the TypeScript source to `mcp-server/dist/index.js`.

### 2. Verify it starts

Before adding it to Claude Code, confirm the server starts correctly:

```bash
CORTEX_API_URL=http://localhost:3000 CORTEX_API_KEY=your-api-key node dist/index.js
```

You should see: `[cortex-mcp] Running on stdio transport`

Press Ctrl+C to exit.

### 3. Add to Claude Code settings

Open Claude Code and add the following to your MCP configuration (Settings → MCP Servers, or edit `claude_code_config.json` directly):

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["/absolute/path/to/cortex/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_URL": "http://localhost:3000",
        "CORTEX_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/absolute/path/to/cortex` with the actual path to your Cortex repository, and `your-api-key-here` with your `API_KEY` from `.env`.

An example configuration file is included at `mcp-server/claude_code_config.json` for reference.

### 4. Restart Claude Code

After saving the configuration, restart Claude Code. The `cortex` MCP server should appear in the tools list.

---

## Available Tools

### `search_knowledge`

Performs semantic search across the knowledge base using embedding similarity. Returns items with relevance scores.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | The search query |
| `category` | string | No | Filter by category slug (e.g. `ai-ml`) |
| `source_type` | string | No | Filter by type: `article`, `youtube`, `reddit`, `twitter`, or `pdf` |
| `date_range` | string | No | Limit to items saved within `7d`, `30d`, or `90d` |
| `limit` | integer | No | Number of results (1–20, default 10) |

**Example response:**
```
Found 3 result(s) for: "transformer architecture"

## Attention Is All You Need
- ID: a1b2c3d4-...
- URL: https://arxiv.org/abs/1706.03762
- Category: ai-ml
- Type: article
- Relevance: 94.2%
- Summary: Introduces the Transformer model, replacing recurrence with self-attention...
```

---

### `get_item`

Retrieves a single item by its UUID or original URL. Returns all metadata, the full summary, key insights, tags, and user notes.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | No* | The item's UUID |
| `url` | string (URL) | No* | The item's original URL |

*At least one of `id` or `url` must be provided.

**Example response:**
```
# Attention Is All You Need

- ID: a1b2c3d4-...
- URL: https://arxiv.org/abs/1706.03762
- Source Type: article
- Author: Vaswani et al.
- Status: completed
- Category: AI/ML
- Tags: transformers, attention, nlp
- Added: 2026-03-01T10:00:00Z

## Summary
Introduces the Transformer model architecture based entirely on attention mechanisms...

## Key Insights
- Self-attention allows modeling of dependencies regardless of sequence distance
- Multi-head attention learns different representation subspaces in parallel
- Positional encodings inject sequence order information
```

---

### `list_categories`

Lists all categories in the knowledge base with item counts and descriptions.

**Parameters:** None.

**Example response:**
```
# Categories (5 total)

## AI/ML
- Slug: ai-ml
- Items: 142

## Web Development
- Slug: web-development
- Items: 87
...
```

---

### `list_recent`

Lists the most recently saved items, optionally filtered by category.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | No | Filter by category slug |
| `limit` | integer | No | Number of items (1–50, default 10) |

**Example response:**
```
# Recent Items (showing 5 of 312)

## Building LLM Applications with LangChain
- ID: b2c3d4e5-...
- URL: https://...
- Type: article
- Category: AI/ML
- Added: 2026-03-22T09:15:00Z
- Summary: A hands-on guide to building production LLM apps...
```

---

### `ask_knowledge`

Asks a natural language question using RAG. Cortex retrieves relevant items and uses an AI model to synthesize a grounded answer with source citations.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `question` | string | Yes | The question to ask |
| `category` | string | No | Restrict the knowledge search to a category slug |

**Example response:**
```
## Answer

RAG (retrieval-augmented generation) grounds model responses in your own data by
retrieving relevant documents at query time, while fine-tuning bakes knowledge
into model weights. RAG is better for knowledge that changes frequently and when
you need source citations. Fine-tuning is better for style adaptation and when
you want consistent behavior without retrieval latency.

## Sources

- **RAG vs Fine-Tuning: A Practical Guide** (92.1% relevant)
  https://example.com/rag-vs-finetuning
  ID: c3d4e5f6-...
- **When to Fine-Tune Your LLM** (88.4% relevant)
  https://example.com/when-to-finetune
  ID: d4e5f6g7-...
```

---

## Example Prompts for Claude

Once the MCP server is configured, you can use prompts like these in Claude Code:

- "Search my knowledge base for articles about React Server Components"
- "What did I save about machine learning this month? Use list_recent with category ai-ml"
- "Ask my knowledge base: what are the key differences between RAG and fine-tuning?"
- "Find everything I've saved from YouTube in the last 30 days"
- "Get the item I saved from https://example.com/some-article and summarize its key insights"
- "List all my categories so I can see what topics I've been collecting"

---

## SSE Transport (Remote Access)

By default, the MCP server uses stdio transport, which means it runs as a subprocess of Claude Code on your local machine. This works well when Cortex and Claude Code are on the same machine.

If you run Cortex on a server and want to access it from multiple machines, you can use the SSE (Server-Sent Events) HTTP transport instead.

### When to use it

- Cortex is running on a remote server or NAS
- You want to share one Cortex instance across multiple devices or team members
- You are using an MCP client that supports SSE transports natively

### Start the SSE server

On your Cortex server:

```bash
cd mcp-server
MCP_TRANSPORT=sse MCP_PORT=3001 CORTEX_API_URL=http://localhost:3000 CORTEX_API_KEY=your-key node dist/index.js
```

Or with the `--sse` flag:

```bash
CORTEX_API_URL=http://localhost:3000 CORTEX_API_KEY=your-key node dist/index.js --sse
```

The server exposes:
- `GET /sse` — establish the SSE stream
- `POST /message?sessionId=<id>` — send messages
- `GET /health` — health check

### Configure Claude Code to use the remote endpoint

In your MCP configuration, use `url` instead of `command`:

```json
{
  "mcpServers": {
    "cortex": {
      "url": "http://your-server:3001/sse"
    }
  }
}
```

> **Note:** The SSE transport does not include built-in authentication. If exposing this over the internet, put it behind a reverse proxy with authentication (e.g. nginx with basic auth or a VPN).
