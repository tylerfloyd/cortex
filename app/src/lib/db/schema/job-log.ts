import {
  pgTable,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { items } from './items';

export const jobLog = pgTable('job_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }),
  jobType: text('job_type').notNull().$type<'content-extraction' | 'ai-processing' | 'embedding' | 'markdown-export'>(), // 'content-extraction' | 'ai-processing' | 'embedding' | 'markdown-export'
  status: text('status').default('queued').$type<'queued' | 'running' | 'completed' | 'failed'>(), // queued | running | completed | failed
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
