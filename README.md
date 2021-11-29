# <p align="center">🐱 TG_Catbox_Uploader</p>

<p align="center"> 简体中文 <a href="https://github.com/AnotiaWang/TG_Catbox_Uploader/blob/main/README_en.md">English</a></p>

<p align="center">简单的 Node.js bot，可将 Telegram 的文件上传到 <a href="https://catbox.moe">Catbox.moe</a> 或 <a href="https://litterbox.catbox.moe">Litterbox</a></p>

<p align="center">A simple Node.js bot for uploading Telegram files to <a href="https://catbox.moe">Catbox</a> or <a href="https://litterbox.catbox.moe">Litterbox</a>.</p>

-------

## 特性

- [x] 可上传 [20 MB](https://core.telegram.org/bots/api#getfile) 以下的音频、视频、文件、贴纸

- [x] 支持 Catbox 和 Litterbox

- [x] 多语言支持 (zh_CN / en_US)，可添加翻译文件

- [x] 可自定义默认语言、默认服务、Litterbox 文件过期时限、说明文字、同时上传文件的数量

- [x] 可自动保存数据，可手动保存和重载数据（`config.json` 和 `strings.json`）

- [x] 支持私聊 / 群组中调用

- [x] 支持 Webhook

## 部署

- 点个 Star 😘

- Clone 此仓库到本地 / 服务器

- 运行以下命令（需有 Node.js 环境）：

```Bash
npm install
node bot
```

## 环境变量

- `token`: 从 BotFather 获得的 Bot token。

- `admin_id`: 机器人拥有者（你本人）的 ID。可从 [GetIDs Bot](https://t.me/getidsbot) 获取。

- `log_channel`: 用于存放记录的频道 ID。*可留空，仅用于回溯确认文件是否违反 ToS*。

- `lang`: [ `zh_CN` / `en_US` ] 用户的默认语言。

- `catbox_token`: [ Optional ] Catbox.moe 账号令牌。如果留空，则为匿名上传文件。填写后可以在 Catbox 账号中管理文件。

- `service`: [ `Catbox` / `Litterbox` ] 用户的默认存储服务。

- `LitterBoxExpr`: [ `1h` / `12h` / `24h` / `72h` ] 用户的默认 Litterbox 文件过期时间。

- `ParallelFiles`: 允许用户同时上传文件的数量（建议 `1`）。

- `webhook_url`: [ 可选 ] Webhook 的 URL，若留空则默认使用 Polling。Express.js 监听端口可在代码中修改，需设置反代。

## Demo

👉👉 [Catbox Uploader Bot](https://t.me/CatboxUploaderBot) 👈👈

## License

MIT License