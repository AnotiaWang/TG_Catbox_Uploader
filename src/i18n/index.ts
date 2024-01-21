import { readdirSync } from 'fs'
import { log } from '../handler/data.js'

class I18n {
  public readonly defaultLang = 'en_US'
  public readonly languages = readdirSync('./src/i18n')
    .filter(n => n.endsWith('.json'))
    .map(n => n.split('.')[0])

  private strings = {}

  async loadStrings() {
    for (const language of this.languages) {
      this.strings[language] = await import(`./${language}.json`) // Relative to index.ts
    }
    log(`Loaded ${this.languages.length} languages: ${this.languages.join(', ')}`)
  }

  t(lang: string, key: string) {
    return this.strings[lang][key] || this.strings[this.defaultLang][key] || key
  }
}

const i18n = new I18n()
i18n.loadStrings()

export default i18n
