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
const litterbox = new CatBox.Litterbox();
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
                Service: config.defaultService,
                LitterBoxExpr: config.defaultLitterBoxExpr,
            };
        var lang = userPrefs[user].lang;
        var service = userPrefs[user].Service;
        var litterboxExpr = userPrefs[user].litterBoxExpr;
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
                if (msg.from.id == admin_id) {
                    strings = JSON.parse(fs.readFileSync('./strings.json', 'utf8'));
                    bot.sendMessage(admin_id, strings[lang].reloadStringsSuccess);
                }
                break;
            case '/save':
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
                        bot.sendMessage(user, strings[lang].uploading.replace('{s}', service));
                        if (service == 'Catbox')
                            catbox.upload('temp/' + user + path.extname(link)).then(function (result) {
                                userPrefs[user].downladInProgress = false;
                                if (result.match('https:\/\/'))
                                    bot.sendMessage(user, strings[lang].uploaded + result);
                                else
                                    bot.sendMessage(user, strings[lang].serviceError.replace('{s}', result));
                                fs.rmSync('temp/' + user + path.extname(link));
                            });
                        else if (service == 'Litterbox')
                            litterbox.upload('temp/' + user + path.extname(link), litterboxExpr).then(function (result) {
                                userPrefs[user].downladInProgress = false;
                                if (result.match('https:\/\/'))
                                    bot.sendMessage(user, strings[lang].uploaded.replace('{s}', litterboxExpr) + result);
                                else
                                    bot.sendMessage(user, strings[lang].serviceError.replace('{s}', result));
                                fs.rmSync('temp/' + user + path.extname(link));
                            });
                    });
                });
            });
        }
    }
});

bot.on('callback_query', (query) => {
    var user = query.from.id;
    var lang = userPrefs[user].lang;
    var hour = strings[lang].hour;
    switch (query.data) {
        case 'setlang_zh_CN':
            userPrefs[user].lang = 'zh_CN';
            bot.editMessageText(strings['zh_CN'].langSetText, { chat_id: query.from.id, message_id: query.message.message_id });
            break;
        case 'setlang_en_US':
            userPrefs[user].lang = 'en_US';
            bot.editMessageText(strings['en_US'].langSetText, { chat_id: query.from.id, message_id: query.message.message_id });
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
            bot.editMessageText(strings[lang].settings_setServiceSuccess.replace('{s}', 'Litterbox'), {
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