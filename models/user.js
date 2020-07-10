
var db = require("mongoose");
db.connect("mongodb://localhost/mychats",{useNewUrlParser: true,useUnifiedTopology: true});

var user_schema = new db.Schema({
    username: String,
    password: String
});

var User = db.model("User",user_schema);

module.exports.User = User;