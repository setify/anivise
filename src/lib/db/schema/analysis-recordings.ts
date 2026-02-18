import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { analyses } from './analyses'
import { users } from './users'

export const analysisRecordings = pgTable(
  'analysis_recordings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    /** Path in Supabase Storage (org-assets) */
    storagePath: text('storage_path'),
    filename: text('filename'),
    mimeType: text('mime_type'),
    fileSize: integer('file_size'),
    /** Duration in seconds */
    durationSeconds: integer('duration_seconds'),
    /** Language used for transcription */
    language: text('language').notNull().default('de'),
    /** Live transcript (accumulated during recording) */
    liveTranscript: text('live_transcript'),
    /** Final high-quality transcript from Deepgram post-processing */
    finalTranscript: text('final_transcript'),
    /** Status of the recording */
    status: text('status').notNull().default('recording'),
    /** Number of chunks uploaded */
    chunksUploaded: integer('chunks_uploaded').notNull().default(0),
    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_analysis_recordings_analysis_id').on(table.analysisId),
  ]
)
