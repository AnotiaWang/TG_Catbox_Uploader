const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const CronJob = require('cron').CronJob;
const path = require('path');
const CatBox = require('catbox.moe');
const express = require('express');
var config = require('./config.json');
var bot = new TelegramBot(config.token);
var admin_id = config.admin_id;
var catbox = new CatBox.Catbox(config.catbox_token);
var litterbox = new CatBox.Litterbox();
var strings = require('./strings.json');
var log_channel = config.log_channel;
var userPrefs = {};
var autoSaveData = new CronJob('0 */5 * * * *', () => saveLogs());

autoSaveData.start();

if (config.webhook_url) {
    var app = express();
    bot.setWebHook(config.webhook_url + `/bot${config.token}`);
    app.use(express.json());
    app.post(`/bot${config.token}`, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
    app.listen(4222, () => { // 可自定义
        console.log(`Express server now listening.`);
    });
}
else {
    console.log('Bot starts polling now.');
    bot.startPolling();
}

if (!fs.existsSync('temp'))
    fs.mkdirSync('temp');

if (fs.existsSync('data.json')) // 读取用户偏好数据
    userPrefs = JSON.parse(fs.readFileSync('data.json'));

bot.on('polling_error', (err) => {
    console.log(err);
});

bot.on('message', (msg) => {
    var user = msg.chat.id;
    if (userPrefs[user] == undefined)
        userPrefs[user] = {
            lang: config.lang,
            downloadInProgress: 0,
            Service: config.service,
            litterBoxExpr: config.LitterBoxExpr,
        };
    var lang = userPrefs[user].lang;
    var service = userPrefs[user].Service;
    var litterboxExpr = userPrefs[user].litterBoxExpr;
    if (msg.chat.type == 'private') {
        if (msg.text) {
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
                case '/settings':
                    bot.sendMessage(user, '⚙ ' + strings[lang].settings, {
                        parse_mode: 'HTML', reply_markup: {
                            inline_keyboard: [[{ text: strings[lang].settings_setLang, callback_data: 'settings_lang' }],
                            [{ text: strings[lang].settings_setService, callback_data: 'settings_service' }],
                            [{ text: strings[lang].settings_setLitterBoxExpr, callback_data: 'settings_litterboxexpr' }]]
                        }
                    });
                    break;
                case '/reload':
                    if (user != admin_id)
                        break;
                    strings = JSON.parse(fs.readFileSync('./strings.json', 'utf8'));
                    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
                    bot.sendMessage(admin_id, strings[lang].reloadSuccess);
                    break;
                case '/save':
                    if (user != admin_id)
                        break;
                    saveLogs();
                    bot.sendMessage(admin_id, strings[lang].saveDataSuccess);
                    break;
                case '/stats':
                    if (user != admin_id)
                        break;
                    let stats = { t: 0, c: 0, e: 0 }; // t: total, c: Chinese, e: English
                    for (let user in userPrefs) {
                        if (userPrefs[user].lang == 'zh_CN')
                            stats.c++;
                        else
                            stats.e++;
                        stats.t++;
                    }
                    bot.sendMessage(admin_id, strings[lang].stats.replace('{t}', stats.t).replace('{c}', stats.c).replace('{e}', stats.e));
                default:
                    break;
            }
            if (msg.text.startsWith('/notify') && user == admin_id) {
                let text = msg.text;
                let zh_CN = text.slice(text.indexOf('[zh_CN]') + 7, text.indexOf('[/zh_CN]'));
                let en_US = text.slice(text.indexOf('[en_US]') + 7, text.indexOf('[/en_US]'));
                if (text == undefined)
                    bot.sendMessage(admin_id, 'Lack of parameters');
                else {
                    Object.keys(userPrefs).forEach(function (key) {
                        if (userPrefs[key].lang == 'zh_CN')
                            bot.sendMessage(key, zh_CN);
                        else if (userPrefs[key].lang == 'en_US')
                            bot.sendMessage(key, en_US);
                        bot.sendMessage(admin_id, 'Notified ' + key).catch((err) => bot.sendMessage(admin_id, 'Fail notifying' + key + '\n\nInfo: \n' + err));
                    });
                }
            }
        }
        else
            upload(msg, user, 0, service, litterboxExpr, lang);
    }
    else if (msg.chat.type == 'group' || msg.chat.type == 'supergroup') {
        if (msg.text) {
            if (msg.text.startsWith('/help'))
                bot.sendMessage(user, strings[lang].help, { parse_mode: 'HTML', disable_web_page_preview: true });
            if (msg.text.startsWith('/settings')) {
                bot.sendMessage(user, '⚙ ' + strings[lang].settings, {
                    parse_mode: 'HTML', reply_markup: {
                        inline_keyboard: [[{ text: strings[lang].settings_setLang, callback_data: 'settings_lang' }],
                        [{ text: strings[lang].settings_setService, callback_data: 'settings_service' }],
                        [{ text: strings[lang].settings_setLitterBoxExpr, callback_data: 'settings_litterboxexpr' }]]
                    }
                });
            }
            if (msg.reply_to_message && msg.text.startsWith('/upload')) {
                var reply = msg.reply_to_message;
                if (reply.document || reply.sticker || reply.photo || reply.audio || reply.video)
                    upload(reply, user, 1, service, litterboxExpr, lang);
                else
                    bot.sendMessage(user, strings[lang].fileNotDetected, { reply_to_message_id: msg.message_id });
            }
        }
    }
});

bot.on('callback_query', (query) => {
    var user = query.message.chat.id;
    var lang = userPrefs[user].lang;
    var hour = strings[lang].hour;
    switch (query.data) {
        case 'setlang_zh_CN':
            userPrefs[user].lang = 'zh_CN';
            bot.editMessageText(strings['zh_CN'].langSetText, { chat_id: user, message_id: query.message.message_id });
            break;
        case 'setlang_en_US':
            userPrefs[user].lang = 'en_US';
            bot.editMessageText(strings['en_US'].langSetText, { chat_id: user, message_id: query.message.message_id });
            break;
        case 'settings_lang':
            bot.editMessageText(strings[lang].settings_setLang, {
                chat_id: user,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[{ text: '简体中文', callback_data: 'setlang_zh_CN' }, { text: 'English', callback_data: 'setlang_en_US' }]]
                }
            });
            break;
        case 'settings_service':
            bot.editMessageText(strings[lang].settings_setService, {
                chat_id: user,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[{ text: 'Catbox', callback_data: 'setService_Catbox' }, { text: 'Litterbox', callback_data: 'setService_Litterbox' }]]
                }
            });
            break;
        case 'setService_Catbox':
            userPrefs[user].Service = 'Catbox';
            bot.editMessageText(strings[lang].settings_setServiceSuccess.replace('{s}', 'Catbox'), {
                chat_id: user,
                message_id: query.message.message_id,
            })
            break;
        case 'setService_Litterbox':
            userPrefs[user].Service = 'Litterbox';
            bot.editMessageText(strings[lang].settings_setServiceSuccess.replace('{s}', 'Litterbox'), {
                chat_id: user,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[{ text: strings[lang].settings_setLitterBoxExpr, callback_data: 'settings_litterboxexpr' }]]
                }
            });
            break;
        case 'settings_litterboxexpr':
            bot.editMessageText(strings[lang].settings_setLitterBoxExpr, {
                chat_id: user,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[{ text: '1' + hour, callback_data: 'setLitterBoxExpr_1' }, { text: '12' + hour, callback_data: 'setLitterBoxExpr_2' }],
                    [{ text: '24' + hour, callback_data: 'setLitterBoxExpr_3' }, { text: '72' + hour, callback_data: 'setLitterBoxExpr_4' }]]
                }
            });
            break;
        case 'setLitterBoxExpr_1':
            userPrefs[user].litterBoxExpr = '1h';
            bot.editMessageText(strings[lang].settings_setLitterBoxExprSuccess.replace('{s}', '1' + hour), {
                chat_id: user,
                message_id: query.message.message_id,
            });
            break;
        case 'setLitterBoxExpr_2':
            userPrefs[user].litterBoxExpr = '12h';
            bot.editMessageText(strings[lang].settings_setLitterBoxExprSuccess.replace('{s}', '12' + hour), {
                chat_id: user,
                message_id: query.message.message_id,
            });
            break;
        case 'setLitterBoxExpr_3':
            userPrefs[user].litterBoxExpr = '24h';
            bot.editMessageText(strings[lang].settings_setLitterBoxExprSuccess.replace('{s}', '24' + hour), {
                chat_id: user,
                message_id: query.message.message_id,
            });
            break;
        case 'setLitterBoxExpr_4':
            userPrefs[user].litterBoxExpr = '72h';
            bot.editMessageText(strings[lang].settings_setLitterBoxExprSuccess.replace('{s}', '72' + hour), {
                chat_id: user,
                message_id: query.message.message_id,
            });
            break;
        default:
            break;
    }
    lang = userPrefs[user].lang;
    if (!query.data.match('settings'))
        bot.answerCallbackQuery(query.id, { text: strings[lang].setSuccess });
});

function saveLogs() {
    fs.writeFileSync('data.json', JSON.stringify(userPrefs));
}

function upload(msg, user, isGroup, service, litterboxExpr, lang) {
    let editMessageID;
    if (msg.document || msg.photo || msg.video || msg.audio || msg.sticker) {
        var dlFileID = '', fileSize;
        if (userPrefs[user].downloadInProgress >= config.ParallelFiles) {
            bot.sendMessage(user, strings[lang].flood_protection.replace('{s}', config.ParallelFiles), { reply_to_message_id: msg.message_id }).then((cb) => editMessageID = cb.message_id);
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
        else if (msg.sticker) {
            if (msg.sticker.is_animated) {
                bot.sendMessage(user, strings[lang].animatedStickers, { disable_web_page_preview: true, reply_to_message_id: msg.message_id, parse_mode: 'HTML' });
            }
            dlFileID = msg.sticker.file_id;
            fileSize = msg.sticker.file_size;
        }
        if (fileSize > 20 * 1024 * 1024) {
            bot.sendMessage(user, strings[lang].err_FileTooBig, { reply_to_message_id: msg.message_id });
            return;
        }
        if (log_channel)
            bot.forwardMessage(log_channel, user, msg.message_id).then((cb) => {
                bot.sendMessage(log_channel, 'ID: ' + msg.from.id, { reply_to_message_id: cb.message_id });
            });
        bot.sendMessage(user, strings[lang].downloading, { reply_to_message_id: msg.message_id }).then((cb) => editMessageID = cb.message_id);
        userPrefs[user].downloadInProgress++;
        bot.getFileLink(dlFileID).then(function (link) {
            let filePath = 'temp/' + user + '_' + userPrefs[user].downloadInProgress + path.extname(link);
            let file = fs.createWriteStream(filePath);
            https.get(link, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close();
                    bot.editMessageText(strings[lang].uploading.replace('{s}', service), { chat_id: msg.chat.id, message_id: editMessageID });
                    if (service == 'Catbox')
                        catbox.upload(filePath).then(function (result) {
                            userPrefs[user].downloadInProgress--;
                            if (result.match('https:\/\/'))
                                bot.editMessageText(strings[lang].uploaded.replace('{s}', '∞') + result, { chat_id: msg.chat.id, message_id: editMessageID });
                            else
                                bot.editMessageText(strings[lang].serviceError.replace('{s}', result), { chat_id: msg.chat.id, message_id: editMessageID });
                            fs.rmSync(filePath);
                        }).catch((err) => {
                            userPrefs[user].downloadInProgress--;
                            console.log(err);
                            bot.editMessageText('err: ' + err.code, { chat_id: msg.chat.id, message_id: editMessageID });
                        });
                    else if (service == 'Litterbox')
                        litterbox.upload(filePath, litterboxExpr).then(function (result) {
                            userPrefs[user].downloadInProgress--;
                            if (result.match('https:\/\/'))
                                bot.editMessageText(strings[lang].uploaded.replace('{s}', litterboxExpr) + result, { chat_id: msg.chat.id, message_id: editMessageID });
                            else
                                bot.editMessageText(strings[lang].serviceError.replace('{s}', result), { chat_id: msg.chat.id, message_id: editMessageID });
                            fs.rmSync(filePath);
                        }).catch((err) => {
                            userPrefs[user].downloadInProgress--;
                            console.log(err);
                            bot.editMessageText('err: ' + err.code, { chat_id: msg.chat.id, message_id: editMessageID });
                        });
                });
            });
        });
    }
    else
        bot.sendMessage(user, strings[lang].fileNotDetected, { reply_to_message_id: msg.message_id });
}
