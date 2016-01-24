var Bot = require('node-telegram-bot');
var data = require('./data.json');
var fs = require('fs');

var bot = new Bot({
  token: '153309606:AAHzkcWyLaBAxvHwdq_gjKzJX5XIWOqcYK0'
})
//
// SHOW LIST OF ALL PHRASES IN CHAT
//
.on('showallstickers', function(message) {
    if(data[message.chat.id])
    {
        var str = '';
        for (key in data[message.chat.id]){
            str += key+" \n"
        }
        bot.sendMessage({
            chat_id: message.chat.id,
            text: str
        }, function(err, res) {
            if(err) return console.error(err);
        });
    }
})
//
// REMOVE STICKER
//
.on('removesticker', function(message, args) {
    if (args) {
        if (args.length > 1) {
            bot.sendMessage({
                chat_id: message.chat.id,
                reply_to_message_id: message.message_id,
                text: 'please only remove one sticker at a time',
            }, function(err, res) {
                if(err) return console.error(err);
            });
        } else if (!data[message.chat.id][args[0]]) {
            bot.sendMessage({
                chat_id: message.chat.id,
                reply_to_message_id: message.message_id,
                text: 'cannot find the Sticker: "'+args[0]+'"',
            }, function(err, res) {
                if(err) return console.error(err);
            });
        } else {
            delete data[message.chat.id][args[0]];
            fs.writeFile('./data.json', JSON.stringify(data), function(err) {
                if (err) return console.log(err);
                bot.sendMessage({
                    chat_id: message.chat.id,
                    text: 'ok, I deleted: "'+args[0]+'"',
                }, function(err, res) {
                    if(err) return console.error(err);
                });
            });
        }
    } else {
        bot.sendMessage({
            chat_id: message.chat.id,
            text: 'please tell me the sticker you want to delete',
            reply_to_message_id: message.message_id,
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }, function(err, res) {
            if(err) return console.error(err);
        });
    }
})
//
// ADD STICKER
//
.on('addsticker', function(message) {
    bot.sendMessage({
        chat_id: message.chat.id,
        text: 'please tell me your phrase',
        reply_to_message_id: message.message_id,
        reply_markup: {
            force_reply: true,
            selective: true
        }
    }, function(err, res) {
        if(err) return console.error(err);
    });
})
.on('message', function (message) {
    if (!data[message.chat.id])
    {
        data[message.chat.id] = {};
        fs.writeFile('./data.json', JSON.stringify(data), function(err) {
            if (err) return console.log(err);
        }
    }

    if (message.reply_to_message)
    {
        bot.getMe(function(err, res){
            if (message.reply_to_message.from.id == res.id) {
                // ADD STICKER
                if (message.reply_to_message.text == 'please tell me your phrase'){
                    console.log('adding new phrase');
                    bot.sendMessage({
                        chat_id: message.chat.id,
                        reply_to_message_id: message.message_id,
                        text: 'please tell me the sticker you want to attach to the phrase: "'+message.text+'"',
                        reply_markup: {
                            force_reply: true,
                            selective: true
                        }
                    }, function(err, res) {
                        if(err) return console.error(err);
                    });
                } else if (message.sticker && message.reply_to_message.text.search('please tell me the sticker you want to attach to the phrase: ')>=0) {
                    var str = message.reply_to_message.text;
                    var newPhrase = str.slice(62, str.length-1);
                    data[message.chat.id][newPhrase] = message.sticker.file_id;
                    fs.writeFile('./data.json', JSON.stringify(data), function(err) {
                        if (err) return console.log(err);
                        bot.sendMessage({
                            chat_id: message.chat.id,
                            text: 'ok, I connected the phrase: "'+newPhrase+'" to your sticker: ',
                        }, function(err, res) {
                            if(err) return console.error(err);
                            bot.sendSticker({
                                chat_id: message.chat.id,
                                file_id: message.sticker.file_id
                            }, function(err, res) {
                                if(err) return console.error(err);
                            });
                        });
                    });
                // DELETE STICKER
                } else if (message.reply_to_message.text == 'please tell me the sticker you want to delete') {
                    if (!data[message.chat.id][message.text]) {
                        bot.sendMessage({
                            chat_id: message.chat.id,
                            reply_to_message_id: message.message_id,
                            text: 'cannot find the Sticker: "'+message.text+'"',
                        }, function(err, res) {
                            if(err) return console.error(err);
                        });
                    } else {
                        delete data[message.chat.id][message.text];
                        fs.writeFile('./data.json', JSON.stringify(data), function(err) {
                            if (err) return console.log(err);
                            bot.sendMessage({
                                chat_id: message.chat.id,
                                text: 'ok, I deleted: "'+message.text+'"',
                            }, function(err, res) {
                                if(err) return console.error(err);
                            });
                        });
                    }
                }
            }
        });
    }
    //
    // normal Twitch Chat Stuff search for phrases and send Stickers
    //
    console.log(message);
    if(message.text) {
        var str = message.text;
        for (key in data[message.chat.id]){
            for (var i = 0; i < 10; i++) {
                var found = str.search(key);
                if (str.search(key)>=0) {
                    if (((found == 0)||(str[found-1] == ' '))&&((found+key.length == str.length)||(str[found+key.length] == ' ')))
                    {
                        bot.sendSticker({
                            chat_id: message.chat.id,
                            file_id: data[message.chat.id][key]
                        }, function(err, res) {
                            if(err) return console.error(err);
                        });
                        str = str.replace(key,'');
                        console.log(" \n send Sticker: "+key+" \n")
                    }
                } else {
                    i += 10;
                }
            }
        }
    }
})
.start();
