# <p align="center">🐱 TG_Catbox_Uploader</p>

<p align="center"><a href="https://github.com/AnotiaWang/TG_Catbox_Uploader#readme">简体中文</a> English</p>

<p align="center">A simple Node.js bot for uploading Telegram files to <a href="https://catbox.moe">Catbox.moe</a> or <a href="https://litterbox.catbox.moe">Litterbox</a>.</p>

------------ 

## Features

- [x] Upload files (stickers, photos, audios, videos) 

- [x] Use Catbox (max 200 MB per file) and Litterbox (max 1 GB per file) as storage

- [x] Multi-language support (zh_CN & en_US currently)

- [x] Default settings customizable

- [x] Available in private chats

- [ ] Available in groups

## Deploy

- Give me a star 😘

- Clone this repo

- Configure the .env file, following the instructions below

- Run the following command: (Node.js environment required)

```Bash
npm install && npm start
```

## Variables

- `BOT_TOKEN`: Bot token from BotFather.

- `API_ID`: API ID obtained from my.telegram.org.

- `API_HASH`: API hash obtained from my.telegram.org.

- `ADMIN_ID`: Admin ID (Usually yours. Get it from [GetIDs Bot](https://t.me/getidsbot)).

- `LOG_CHANNEL_ID`: Channel to store logs. Can be left empty. *This is only needed to check if files violated the ToS*.

- `DEFAULT_LANG`: [ `zh_CN` / `en_US` ] Default language for your users.

- `CATBOX_TOKEN`: [ Optional ] Catbox.moe token. If empty, bot will upload files anonymously. If specfied, you can manage the uploaded files in your Catbox account.

- `DEFAULT_SERVICE`: [ `Catbox` / `Litterbox` ] Default service for your users.

- `DEFAULT_EXPR`: [ `1h` / `12h` / `24h` / `72h` ] Default expiration for your users, if they selected Litterbox as storage.

- `MAX_DOWNLOADING`: Default number of parallel file uploads. (Recommended `1`)

- `WEBHOOK_URL`: [ Optional ] Webhook URL. If not specified, bot will use polling as default. The port that express.js listens can be changed in the code. You may use a reverse proxy to make it work.

## Demo

👉👉 [Catbox Uploader Bot](https://t.me/CatboxUploaderBot) 👈👈

## Translations

1. Fork this repo

2. Create a new file in the `src/i18n` folder, named `[language_code].json`, replace `-` (if exist) to `_`(e.g. `en_US.json`). For list of language codes, see [here](http://www.lingoes.net/zh/translator/langcode.htm)

3. Edit the file, and add your translation, according to `zh_CN.json` (Chinese is my mother tongue, so the expressions may be more accurate. You can also choose other files as the source). All properties in `zh_CN.json` are required.

4. Commit and push your changes. Create a Pull Request. 

> You can also directly edit the files in Web IDE, and create Pull Request after modifying.

## License

MIT License