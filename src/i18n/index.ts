import { readdirSync, readFileSync } from 'fs'
import { log } from '../handler/data.js'

class I18n {
  public readonly defaultLang = 'en_US'
  public readonly languages = readdirSync('./src/i18n')
    .filter(n => n.endsWith('.json'))
    .map(n => n.split('.')[0])

  private strings: Record<string, Record<string, string>> = {}

  async loadStrings() {
    for (const language of this.languages) {
      this.strings[language] = JSON.parse(readFileSync(`./src/i18n/${language}.json`, 'utf-8'))
    }
    log(`Loaded ${this.languages.length} languages: ${this.languages.join(', ')}`)
  }

  t(lang: string, key: string, args?: string[]) {
    const str = this.strings[lang]?.[key] || this.strings[this.defaultLang]?.[key] || key
    return args?.length ? str.replace(/{(\d+)}/g, (s, n, ...r) => args[n - 1] || s) : str
  }
}

const i18n = new I18n()
i18n.loadStrings()

export default i18n
