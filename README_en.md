# <p align="center">🐱 TG_Catbox_Uploader</p>

<p align="center"><a href="https://github.com/AnotiaWang/TG_Catbox_Uploader#readme">简体中文</a> English</p>

<p align="center">A simple Node.js bot for uploading Telegram files to <a href="https://catbox.moe">Catbox.moe</a> or <a href="https://litterbox.catbox.moe">Litterbox</a>.</p>

------------ 

## Features

- [x] Upload files(stickers, photos, audios, videos) under [20 MB](https://core.telegram.org/bots/api#getfile)

- [x] Supports Catbox and Litterbox as storage

- [x] Multi-language support (zh_CN / en_US), can be customized

- [x] Auto save data; Auto/Manual save/reload data.

- [x] Customizable strings & language & service & Litterbox file expiration & parallel file uploads

- [x] Supports groups and private chats

- [x] Supports webhooks

## Deploy

- Give me a star 😘

- Clone this repo

- Run the following command: (Node.js environment required)

```Bash
npm install
node bot
```

## Variables

- `token`: Bot token from BotFather.

- `admin_id`: Admin ID (Usually yours. Get it from [GetIDs Bot](https://t.me/getidsbot)).

- `log_channel`: Channel to store logs. Can be left empty. *This is only used to check if files violated the ToS*.

- `lang`: [ `zh_CN` / `en_US` ] Default language for your users.

- `catbox_token`: [ Optional ] Catbox.moe token. If empty, bot will upload files anonymously. If specfied, you can manage the uploaded files in your Catbox account.

- `service`: [ `Catbox` / `Litterbox` ] Default service for your users.

- `LitterBoxExpr`: [ `1h` / `12h` / `24h` / `72h` ] Default expiration for your users, if they selected Litterbox as storage.

- `ParallelFiles`: Default number of parallel file uploads. (Recommended `1`)

- `webhook_url`: [ Optional ] Webhook URL. If not specified, bot will use polling as default. The port that express.js listens can be changed in the code. You may use a reverse proxy to make it work.

## Demo

👉👉 [Catbox Uploader Bot](https://t.me/CatboxUploaderBot) 👈👈

## License

MIT License