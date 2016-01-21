var Bot = require('node-telegram-bot');
var data = require('./data.json');
var fs = require('fs');

var bot = new Bot({
  token: '153309606:AAHzkcWyLaBAxvHwdq_gjKzJX5XIWOqcYK0'
})
.on('addSticker', function(message) {
    bot.sendMessage({
        chat_id: message.chat.id,
        text: 'please tell me your phrase',
        reply_markup: {
            force_reply: true
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
                        text: 'please tell me the sticker you want to attach to the phrase: "'+message.text+'"',
                        reply_markup: {
                            force_reply: true
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

    console.log(message);
    if(message.text) {
        for (key in data){
            if (message.text.search(key)>=0){
                bot.sendSticker({
                    chat_id: message.chat.id,
                    file_id: data[key]
                }, function(err, res) {
                    if(err) return console.error(err);
                });
                console.log(" \n send Sticker: "+key+" \n")
            }
        }
    }
})
.start();
