import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { searchKnowledgeSchema, handleSearchKnowledge } from './tools/search.js';
import { getItemSchema, handleGetItem } from './tools/get-item.js';
import { listCategoriesSchema, handleListCategories } from './tools/categories.js';
import { listRecentSchema, handleListRecent } from './tools/recent.js';
import { askKnowledgeSchema, handleAskKnowledge } from './tools/ask.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'cortex',
    version: '1.0.0',
  });

  // search_knowledge
  server.tool(
    'search_knowledge',
    'Perform semantic search across the Cortex knowledge base. Returns relevant items with titles, summaries, and relevance scores.',
    searchKnowledgeSchema,
    async (args) => {
      return handleSearchKnowledge(args);
    }
  );

  // get_item
  server.tool(
    'get_item',
    'Retrieve a full knowledge base item by its UUID or original URL. Returns all metadata, summary, key insights, and tags.',
    getItemSchema,
    async (args) => {
      const { id, url } = args;
      return handleGetItem({ id, url });
    }
  );

  // list_categories
  server.tool(
    'list_categories',
    'List all categories in the Cortex knowledge base, including item counts and descriptions.',
    listCategoriesSchema,
    async () => {
      return handleListCategories();
    }
  );

  // list_recent
  server.tool(
    'list_recent',
    'List the most recently added items in the knowledge base, optionally filtered by category.',
    listRecentSchema,
    async (args) => {
      return handleListRecent(args);
    }
  );

  // ask_knowledge
  server.tool(
    'ask_knowledge',
    'Ask a natural language question about your knowledge base. Uses RAG (retrieval-augmented generation) to find relevant items and synthesize a grounded answer with source citations. Optionally filter by category slug.',
    askKnowledgeSchema,
    async (args) => {
      const { question, category } = args;
      return handleAskKnowledge({ question, category });
    }
  );

  return server;
}

// Re-export for convenience
export { z };
