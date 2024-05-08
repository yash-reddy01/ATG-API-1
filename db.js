const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:Yash%402001@cluster0.rkdvdjf.mongodb.net/UserCredentials")
.then(() => {
    console.log("db connected");
})
.catch(() => {
    console.log("error while connecting");
});


const userSchema = mongoose.Schema({
    username: String,
    password: String,
    email: String
});

const postSchema = mongoose.Schema({
    user: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});


const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

module.exports = {
    User, Post
}

