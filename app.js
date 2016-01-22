var Bot = require('node-telegram-bot');
var data = require('./data.json');
var fs = require('fs');

var bot = new Bot({
  token: '153309606:AAHzkcWyLaBAxvHwdq_gjKzJX5XIWOqcYK0'
})
.on('showallstickers', function(message) {
    var str = '';
    for (key in data){
        str += key+" \n"
    }
    bot.sendMessage({
        chat_id: message.chat.id,
        text: str
    }, function(err, res) {
        if(err) return console.error(err);
    });
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
    if (message.reply_to_message)
    {
        bot.getMe(function(err, res){
            if (message.reply_to_message.from.id == res.id) {
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
                }
                else if (message.sticker && message.reply_to_message.text.search('please tell me the sticker you want to attach to the phrase: ')>=0){
                    var str = message.reply_to_message.text;
                    var newPhrase = str.slice(62, str.length-1);
                    data[newPhrase] = message.sticker.file_id;
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
        for (key in data){
            for (var i = 0; i < 10; i++) {
                var found = str.search(key);
                if (str.search(key)>=0) {
                    if (((found == 0)||(str[found-1] == ' '))&&((found+key.length == str.length)||(str[found+key.length] == ' ')))
                    {
                        bot.sendSticker({
                            chat_id: message.chat.id,
                            file_id: data[key]
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
