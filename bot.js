const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const path = require('path');
const config = require('./config.json');
const CatBox = require('catbox.moe');
const CronJob = require('cron').CronJob;
const bot = new TelegramBot(config.token, { polling: true });
const admin_id = config.admin_id;
const logChannel = config.logChannel;
const catbox = new CatBox.Catbox(config.catbox_token);
var strings = require('./strings.json');
var userPrefs = {};
var autoSaveLogs = new CronJob('0 */5 * * * *', () => saveLogs());
autoSaveLogs.start();

function saveLogs() {
    fs.writeFileSync('data.json', JSON.stringify(userPrefs));
}

if (!fs.existsSync('temp'))
    fs.mkdirSync('temp');

if (fs.existsSync('data.json'))
    userPrefs = JSON.parse(fs.readFileSync('data.json'));

bot.on('polling_error', (err) => {
    console.log(err);
});

bot.on('message', (msg) => {
    if (msg.chat.type == 'private') {
        var user = msg.chat.id;
        if (userPrefs[user] == undefined)
            userPrefs[user] = {
                lang: config.defaultLang,
                downladInProgress: false,
            };
        var lang = userPrefs[user].lang;
        switch (msg.text) {
            case '/start':
                bot.sendMessage(user, '🐱 <b>欢迎！请选择您的语言：\n\nWelcome! Please select a language:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[{ text: '中文', callback_data: 'setlang_zh_CN' }, { text: 'English', callback_data: 'setlang_en_US' }]]
                    }
                });
                break;
            case '/help':
                bot.sendMessage(user, strings[lang].help, { parse_mode: 'HTML', disable_web_page_preview: true });
                break;
            case '/setlang':
                bot.sendMessage(msg.from.id, '⚙ 请选择语言\nSelect your language', {
                    parse_mode: 'HTML', reply_markup: {
                        inline_keyboard: [[{ text: "简体中文", callback_data: "setlang_zh_CN" }, { text: "English", callback_data: "setlang_en_US" }]]
                    }
                });
                break;
            case '/reload':
                if (msg.from.id == admin_id) {
                    strings = JSON.parse(fs.readFileSync('./strings.json', 'utf8'));
                    bot.sendMessage(admin_id, strings[lang].reloadStringsSuccess);
                }
            case '/savedata':
                if (msg.from.id == admin_id)
                    saveLogs();
                bot.sendMessage(admin_id, strings[lang].saveDataSuccess);
            default:
                break;
        }

        if (msg.document || msg.photo || msg.video || msg.audio) {
            var dlFileID = '', fileSize = '';
            if (userPrefs[user].downladInProgress) {
                bot.sendMessage(user, strings[lang].flood_protection, { reply_to_message_id: msg.message_id });
                return;
            }
            if (msg.document) {
                dlFileID = msg.document.file_id;
                fileSize = msg.document.file_size;
            }
            else if (msg.photo) {
                dlFileID = msg.photo[msg.photo.length - 1].file_id;
                fileSize = msg.photo[msg.photo.length - 1].file_size;
            }
            else if (msg.video) {
                dlFileID = msg.video.file_id;
                fileSize = msg.video.file_size;
            }
            else if (msg.audio) {
                dlFileID = msg.audio.file_id;
                fileSize = msg.audio.file_size;
            }
            if (fileSize > 20 * 1024 * 1024) {
                bot.sendMessage(user, strings[lang].err_FileTooBig);
                return;
            }
            if (logChannel)
                bot.forwardMessage(logChannel, user, msg.message_id).then((cb) => {
                    bot.sendMessage(logChannel, 'ID: ' + user, { reply_to_message_id: cb.message_id });
                });
            bot.sendMessage(user, strings[lang].downloading);
            userPrefs[user].downladInProgress = true;
            bot.getFileLink(dlFileID).then(function (link) {
                var file = fs.createWriteStream('temp/' + user + path.extname(link));
                https.get(link, function (response) {
                    response.pipe(file);
                    file.on('finish', function () {
                        file.close();
                        bot.sendMessage(user, strings[lang].uploading);
                        catbox.upload('temp/' + user + path.extname(link)).then(function (result) {
                            fs.rmSync('temp/' + user + path.extname(link));
                            userPrefs[user].downladInProgress = false;
                            bot.sendMessage(user, strings[lang].uploaded + result);
                        });
                    });
                });
            });
        }
    }
});

bot.on('callback_query', (query) => {
    var user = query.from.id;
    if (query.data == "setlang_zh_CN")
        userPrefs[user].lang = "zh_CN";
    else if (query.data == "setlang_en_US")
        userPrefs[user].lang = "en_US";
    var lang = userPrefs[user].lang;
    bot.answerCallbackQuery(query.id, { text: strings[lang].setSuccess });
    bot.editMessageText(strings[lang].langSetText, { chat_id: query.from.id, message_id: query.message.message_id });
});