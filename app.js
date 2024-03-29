var Bot = require('node-telegram-bot');
var fs = require('fs');

var about = fs.readFileSync('./about.txt', "utf8");


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

var dataSchema = mongoose.Schema({
    chat_id: {type: Number, unique: true},
    emotes: [{phrase: String, data_type: String, file_id: String}]
});

var Data = mongoose.model('Data', dataSchema);

var bot = new Bot({
    token: '168724196:AAEA-dYbF_H5TkdX1LiMl938t8KjwjS5k8s'
})
.enableAnalytics('E:C3zicbJEILfdKoISNvE4tIXq6Gicnp')
.on('start', function(message) {
    this.analytics.track(message, 'start');
    bot.sendMessage({
        chat_id: message.chat.id,
        text: about,
        disable_web_page_preview: true,
    }, function(err, res) {
        if(err) return console.error(err);
    });
})
.on('about', function(message) {
    this.analytics.track(message, 'about');
    bot.sendMessage({
        chat_id: message.chat.id,
        text: about,
        disable_web_page_preview: true,
        disable_notification: true,
    }, function(err, res) {
        if(err) return console.error(err);
    });
})
//
// SHOW LIST OF ALL Emotes
//
.on('showallemotes', function(message) {
    this.analytics.track(message, 'showallemotes');
    Data.findOne({chat_id: message.chat.id}, 'emotes', function(err, data) {
        if (data) {
            var str = '';
            data.emotes.sort();
            for (var i = 0; i < data.emotes.length; i++){
                str += data.emotes[i].phrase+" \n"
            }
            bot.sendMessage({
                chat_id: message.chat.id,
                text: str,
                disable_notification: true,
            }, function(err, res) {
                if(err) return console.error(err);
            });
        }
        else {
            bot.sendMessage({
                chat_id: message.chat.id,
                text: 'You have no Emotes, add your first Emote via /addemote',
                disable_notification: true,
            }, function(err, res) {
                if(err) return console.error(err);
            });
        }
    });
})
//
// install pre configured
//
.on('installemotes', function(message) {
    this.analytics.track(message, 'installemotes');
    Data.findOne({chat_id: 1337}, 'emotes', function(err, data) {
        Data.update(
            {chat_id: message.chat.id},
            {$addToSet: {emotes: {$each: data.emotes}}},
            {upsert: true},
            function (err) {
                if (err) return console.log(err);
                bot.sendMessage({
                    chat_id: message.chat.id,
                    text: 'installed some Emotes for you, see them with /showallemotes',
                    disable_notification: true,
                }, function(err, res) {
                    if(err) return console.error(err);
                });
        });
    });
})
//
// REMOVE Emote
//
.on('deleteemote', function(message, args) {
    var botObj = this;
    if (args) {
        if (args.length > 1) {
            bot.sendMessage({
                chat_id: message.chat.id,
                reply_to_message_id: message.message_id,
                text: 'please only remove one emote at a time',
                disable_notification: true,
            }, function(err, res) {
                if(err) return console.error(err);
            });
        } else {
            Data.findOne({'chat_id': message.chat.id}, 'emotes', function (err, data) {
                if (err) return console.log(err);
                var index = -1;
                if (data)
                {
                    for (var i = 0; i < data.emotes.length; i++)
                    {
                        if (data.emotes[i].phrase == args[0]){
                            index = i;
                            break;
                        }
                    }
                }
                if (index >= 0) {
                    data.emotes.splice(index, 1);
                    data.save(function (err) {
                        if(err) return console.log(err);
                        bot.sendMessage({
                            chat_id: message.chat.id,
                            text: 'ok, I deleted: "'+args[0]+'"',
                            disable_notification: true,
                        }, function(err, res) {
                            if(err) return console.error(err);
                            botObj.analytics.track(message, 'deleted Emote');
                        });
                    })
                } else {
                    bot.sendMessage({
                        chat_id: message.chat.id,
                        reply_to_message_id: message.message_id,
                        text: 'cannot find the Emote: "'+args[0]+'"',
                        disable_notification: true,
                    }, function(err, res) {
                        if(err) return console.error(err);
                    });
                }
            });
        }
    } else {
        bot.sendMessage({
            chat_id: message.chat.id,
            text: 'please tell me the emote you want to delete',
            reply_to_message_id: message.message_id,
            disable_notification: true,
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
// ADD Emote
//
.on('addemote', function(message) {
    bot.sendMessage({
        chat_id: message.chat.id,
        text: 'please tell me your phrase',
        reply_to_message_id: message.message_id,
        disable_notification: true,
        reply_markup: {
            force_reply: true,
            selective: true
        }
    }, function(err, res) {
        if(err) return console.error(err);
    });
})
.on('message', function (message) {
    var botObj = this;
    if (message.reply_to_message)
    {
        bot.getMe(function(err, res){
            if (message.reply_to_message.from.id == res.id) {
                // ADD EMOTE
                if (message.reply_to_message.text == 'please tell me your phrase'){
                    console.log('adding new phrase');
                    bot.sendMessage({
                        chat_id: message.chat.id,
                        reply_to_message_id: message.message_id,
                        text: 'please tell me the sticker/gif/photo you want to attach to the phrase: "'+message.text+'"',
                        disable_notification: true,
                        reply_markup: {
                            force_reply: true,
                            selective: true
                        }
                    }, function(err, res) {
                        if(err) return console.error(err);
                    });
                } else if (message.reply_to_message.text.indexOf('please tell me the sticker/gif/photo you want to attach to the phrase: ')>=0) {
                    Data.findOne({'chat_id': message.chat.id}, 'emotes', function (err, data) {
                        if (err) return console.log(err);
                        var str = message.reply_to_message.text;
                        var newPhrase = str.slice(72, str.length-1);
                        var index = -1;
                        if (data)
                        {
                            for (var i = 0; i < data.emotes.length; i++)
                            {
                                if (data.emotes[i].phrase == newPhrase){
                                    index = i;
                                    break;
                                }
                            }
                        }
                        if (index >= 0) {
                            bot.sendMessage({
                                chat_id: message.chat.id,
                                text: 'looks like you already have an emote connected to: "'+newPhrase+'", if you want to connect something else to it, you have to delete it first via: "/deleteemote '+newPhrase+'"',
                                disable_notification: true,
                            }, function(err, res) {
                                if(err) return console.error(err);
                            });
                        } else {
                            if (message.sticker) {
                                Data.update(
                                    {chat_id: message.chat.id},
                                    {$push: {emotes: {phrase: newPhrase, data_type: 'sticker', file_id: message.sticker.file_id}}},
                                    {upsert: true},
                                    function (err) {
                                        if (err) return console.log(err);
                                        bot.sendMessage({
                                                chat_id: message.chat.id,
                                                text: 'ok, I connected the phrase: "'+newPhrase+'" to your sticker: ',
                                                disable_notification: true,
                                            }, function(err, res) {
                                                if(err) return console.error(err);
                                                botObj.analytics.track(message, 'add Sticker');
                                                bot.sendSticker({
                                                    chat_id: message.chat.id,
                                                    file_id: message.sticker.file_id,
                                                    disable_notification: true,
                                                }, function(err, res) {
                                                    if(err) return console.error(err);
                                                });
                                        });
                                });
                            } else if (message.document && message.document.mime_type == 'video/mp4') {
                                Data.update(
                                    {chat_id: message.chat.id},
                                    {$push: {emotes: {phrase: newPhrase, data_type: 'gif', file_id: message.document.file_id}}},
                                    {upsert: true},
                                    function (err) {
                                        if (err) return console.log(err);
                                        bot.sendMessage({
                                                chat_id: message.chat.id,
                                                text: 'ok, I connected the phrase: "'+newPhrase+'" to your gif: ',
                                                disable_notification: true,
                                            }, function(err, res) {
                                                if(err) return console.error(err);
                                                botObj.analytics.track(message, 'add gif');
                                                bot.sendDocument({
                                                    chat_id: message.chat.id,
                                                    file_id: message.document.file_id,
                                                    disable_notification: true,
                                                }, function(err, res) {
                                                    if(err) return console.error(err);
                                                });
                                        });
                                });
                            } else if (message.photo) {
                                Data.update(
                                    {chat_id: message.chat.id},
                                    {$push: {emotes: {phrase: newPhrase, data_type: 'photo', file_id: message.photo[0].file_id}}},
                                    {upsert: true},
                                    function (err) {
                                        if (err) return console.log(err);
                                        bot.sendMessage({
                                                chat_id: message.chat.id,
                                                text: 'ok, I connected the phrase: "'+newPhrase+'" to your photo: ',
                                                disable_notification: true,
                                            }, function(err, res) {
                                                if(err) return console.error(err);
                                                botObj.analytics.track(message, 'add photo');
                                                bot.sendPhoto({
                                                    chat_id: message.chat.id,
                                                    file_id: message.photo[0].file_id,
                                                    disable_notification: true,
                                                }, function(err, res) {
                                                    if(err) return console.error(err);
                                                });
                                        });
                                });
                            } else {
                                bot.sendMessage({
                                        chat_id: message.chat.id,
                                        text: 'sorry, due to telegrams way of handling files you can only use stickers / photos / gifs (up to 15 MB). You cannot use videos / text / emoticons / audio as of now.',
                                        disable_notification: true,
                                    }, function(err, res) {
                                        if(err) return console.error(err);
                                        botObj.analytics.track(message, 'not supported file');
                                });
                            }
                        }
                    });
                // DELETE EMOTE
                } else if (message.reply_to_message.text == 'please tell me the emote you want to delete') {
                    console.log("test");
                    Data.findOne({'chat_id': message.chat.id}, 'emotes', function (err, data) {
                        if (err) return console.log(err);
                        var index = -1;
                        if (data)
                        {
                            for (var i = 0; i < data.emotes.length; i++)
                            {
                                if (data.emotes[i].phrase == message.text){
                                    index = i;
                                    break;
                                }
                            }
                        }
                        if (index >= 0) {
                            data.emotes.splice(index, 1);
                            data.save(function (err) {
                                if(err) return console.log(err);
                                bot.sendMessage({
                                    chat_id: message.chat.id,
                                    text: 'ok, I deleted: "'+message.text+'"',
                                    disable_notification: true,
                                }, function(err, res) {
                                    botObj.analytics.track(message, 'deleted Emote');
                                    if(err) return console.error(err);
                                });
                            })
                        } else {
                            bot.sendMessage({
                                chat_id: message.chat.id,
                                reply_to_message_id: message.message_id,
                                text: 'cannot find the Emote: "'+message.text+'"',
                                disable_notification: true,
                            }, function(err, res) {
                                if(err) return console.error(err);
                            });
                        }
                    });
                }
            }
        });
    }
    //
    // normal Twitch Chat Stuff search for phrases and send Stickers/Gifs
    //
    console.log(message);
    if(message.text) {
        Data.findOne({'chat_id': message.chat.id}, 'emotes', function (err, data) {
            if (err) return console.log(err);
            if (data) {
                var str = message.text;
                for (var i = 0; i < data.emotes.length; i++){
                    var emote = data.emotes[i];
                    for (var j = 0; j < 10; j++) {
                        var found = str.indexOf(emote.phrase);
                        if (found>=0) {
                            if (((found == 0)||(str[found-1] == ' '))&&((found+emote.phrase.length == str.length)||(str[found+emote.phrase.length] == ' ')))
                            {
                                if(emote.data_type == 'sticker') {
                                    bot.sendSticker({
                                        chat_id: message.chat.id,
                                        file_id: emote.file_id,
                                        disable_notification: true,
                                    }, function(err, res) {
                                        if(err) return console.error(err);
                                        botObj.analytics.track(message, 'send sticker');
                                    });
                                    str = str.replace(emote.phrase,'');
                                } else if (emote.data_type == 'gif') {
                                    bot.sendDocument({
                                        chat_id: message.chat.id,
                                        file_id: emote.file_id,
                                        disable_notification: true,
                                    }, function(err, res) {
                                        if(err) return console.error(err);
                                        botObj.analytics.track(message, 'send gif');
                                    });
                                    str = str.replace(emote.phrase,'');
                                } else if (emote.data_type == 'photo') {
                                    bot.sendPhoto({
                                        chat_id: message.chat.id,
                                        file_id: emote.file_id,
                                        disable_notification: true,
                                    }, function(err, res) {
                                        if(err) return console.error(err);
                                        botObj.analytics.track(message, 'send photo');
                                    });
                                    str = str.replace(emote.phrase,'');
                                }
                            }
                        } else {
                            j += 10;
                        }
                    }
                }
            }
        });
    }
})
.on('test', function(message) {
    console.log(this);
    console.log(this.analytics);
    this.analytics.track(message, 'start');
})
.start();
