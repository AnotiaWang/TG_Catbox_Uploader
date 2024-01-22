import 'dotenv/config'
import type { LitterboxExpiration } from './types/data.js'

export const DEFAULT_LANG = process.env.DEFAULT_LANG
export const DEFAULT_SERVICE = process.env.DEFAULT_SERVICE
export const DEFAULT_EXPR = parseInt(process.env.DEFAULT_EXPR) as LitterboxExpiration
export const ADMIN_ID = parseInt(process.env.ADMIN_ID)
export const MAX_DOWNLOADING = parseInt(process.env.MAX_DOWNLOADING)
export const BOT_TOKEN = process.env.BOT_TOKEN
export const API_ID = parseInt(process.env.API_ID)
export const API_HASH = process.env.API_HASH
export const LOG_CHANNEL_ID = parseInt(process.env.LOG_CHANNEL_ID)
export const CATBOX_TOKEN = process.env.CATBOX_TOKEN
export const DOWNLOAD_DC_ID = parseInt(process.env.DOWNLOAD_DC_ID) || 5
export const DOWNLOAD_WORKERS = parseInt(process.env.DOWNLOAD_WORKERS) || 5

if (!BOT_TOKEN || !API_ID || !API_HASH) {
  console.error('Please set BOT_TOKEN, API_ID and API_HASH in .env file')
  process.exit(1)
}
