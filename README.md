# <p align="center">🐱 TG_Catbox_Uploader</p>

<p align="center"> 简体中文 <a href="https://github.com/AnotiaWang/TG_Catbox_Uploader/blob/main/README_en.md">English</a></p>

<p align="center">简单的 Node.js bot，可将 Telegram 的文件上传到 <a href="https://catbox.moe">Catbox.moe</a>。</p>

<p align="center">A simple Node.js bot for uploading Telegram files to <a href="https://catbox.moe">Catbox.moe</a>.</p>

## 特性

- [x] 可上传 [20 MB](https://core.telegram.org/bots/api#getfile) 以下的文件 (x)

- [x] 多语言支持 (zh_CN / en_US)，可添加翻译文件

- [x] 可自动 / 手动保存数据

- [x] 可自定义字符串

## 部署

- 点个 Star 😘

- Clone 本仓库到本地

- 运行以下命令：

```Bash
npm install
node bot
```

## 变量

- `token`: 从 BotFather 获得的 Bot token。

- `admin_id`: 机器人拥有者（你本人）的 ID。可从 [GetIDs Bot](https://t.me/getidsbot) 获取。

- `logChannel`: 用于存放记录的频道 ID。*可留空，仅用于回溯确认文件是否违反 ToS*。

- `defaultLang`: `zh_CN` / `en_US` 用户的默认语言。

- `catbox_token`: [Optional] Catbox.moe 令牌. 如果留空，则为匿名上传文件。填写后可以在 Catbox 账号中管理文件。

## Demo

👉👉 [Catbox Uploader Bot](https://t.me/CatboxUploaderBot) 👈👈

## License

MIT License