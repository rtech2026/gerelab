import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------ */
/* Better Auth tables (reused — already present in the Neon database)  */
/* Column names are camelCase to match Better Auth defaults.          */
/* ------------------------------------------------------------------ */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').$defaultFn(() => new Date()),
})

/* ------------------------------------------------------------------ */
/* AuraVoice app tables (prefixed av_ to coexist in a shared database) */
/* No foreign keys by default — scoping is done per-query by userId.   */
/* ------------------------------------------------------------------ */

export const userCredits = pgTable('av_user_credits', {
  userId: text('userId').primaryKey(),
  plan: text('plan').notNull().default('free'),
  charLimit: integer('char_limit').notNull().default(15000),
  charsUsed: integer('chars_used').notNull().default(0),
  periodEnd: timestamp('period_end').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const generation = pgTable('av_generation', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  text: text('text').notNull(),
  voiceId: text('voice_id').notNull(),
  voiceName: text('voice_name').notNull(),
  language: text('language'),
  format: text('format').notNull().default('mp3'),
  charCount: integer('char_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const clonedVoice = pgTable('av_cloned_voice', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  lmntVoiceId: text('lmnt_voice_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  gender: text('gender'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
