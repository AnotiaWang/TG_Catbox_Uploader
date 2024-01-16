export type StorageService = 'Catbox' | 'Litterbox'

export type LitterboxExpiration = 1 | 12 | 24 | 72

export interface UserData {
  lang: string
  downloading: number
  total: number
  service: StorageService
  /** Litterbox Expiration */
  lbe: LitterboxExpiration
  banned: boolean
  token: string
}