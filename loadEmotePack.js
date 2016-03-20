var myID = 103830014;

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

Data.findOne({chat_id: myID}, 'emotes', function(err, data) {
    Data.update(
        {chat_id: 1337},
        {$addToSet: {emotes: {$each: data.emotes}}},
        {upsert: true},
        function (err) {
            if (err) return console.log(err);
            console.log('done');
    });
});
