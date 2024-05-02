const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:Yash%402001@cluster0.rkdvdjf.mongodb.net/UserCredentials")
.then(() => {
    console.log("db connected");
})
.catch(() => {
    console.log("error while connecting");
});


const userSchema = mongoose.Schema({
    "username": String,
    "password": String,
    "email": String
});



const User = mongoose.model('User', userSchema)

module.exports = User

