# TG_Catbox_Uploader

<p align="center">简单的 Node.js bot，可将 Telegram 的文件上传到 [Catbox.moe](https://catbox.moe)。</p>

<p align="center">A simple Node.js bot for uploading Telegram files to [Catbox.moe](https://catbox.moe).</p>

## Features

- [x] Upload files under [20 MB](https://core.telegram.org/bots/api#getfile)
- [x] Multi-language support (zh_CN / en_US)
- [x] Auto save data
- [x] Customizable strings
## Deploy

- Clone this repo

- Run the following command:

```Bash
npm install
node bot
```

## Variables

- `token`: Bot token from BotFather.
- `admin_id`: Admin ID (Usually yours. Get it from [GetIDs Bot](https://t.me/getidsbot)).
- `logChannel`: Channel to store logs.
- `defaultLang`: `zh_CN` / `en_US` Default language for your users.
- `catbox_token`: [Optional] Catbox.moe token. If empty, bot will upload files anonymously.

## Demo

👉👉 [Catbox Uploader Bot](https://t.me/CatboxUploaderBot) 👈👈

## License

MIT License