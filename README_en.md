# <p align="center">🐱 TG_Catbox_Uploader</p>

<p align="center"><a href="https://github.com/AnotiaWang/TG_Catbox_Uploader#readme">简体中文</a> English</p>

<p align="center">A simple Node.js bot for uploading Telegram files to <a href="https://catbox.moe">Catbox.moe</a> or <a href="https://litterbox.catbox.moe">Litterbox</a>.</p>

------------ 

## Features

- [x] Upload files (stickers, photos, audios, videos) 

- [x] Supports Catbox (max 200 MB per file) and Litterbox (max 1 GB per file) as storage

- [x] Multi-language support (zh_CN & en_US currently)

- [x] Default settings customizable

- [x] Supports private chats

- [ ] Supports groups

- [ ] Supports webhooks

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

## License

MIT License