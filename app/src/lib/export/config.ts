import path from 'path';

export const KNOWLEDGE_DIR = process.env.KNOWLEDGE_DIR ?? path.join(process.cwd(), 'knowledge');
