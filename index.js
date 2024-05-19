const express = require("express");
const { User, Post } = require("./db");
const z = require("zod");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require("./config");
const { authMiddleware } = require("./middleware");


const app = express();

app.use(express.json());

const signUp = z.object({
    username: z.string(),
    password: z.string(),
    email: z.string().email()
})

//1. User registration using email password & username
app.post("/signup", async (req, res) => {
    const data = req.body;
    const { success } = signUp.safeParse(data);

    if(!success) {
        return res.status(411).json({
            "message": "Invalid inputs"
        })
    }

    const existingUser = await User.findOne({
        $or: [
            {username: data.username},
            {email: data.email}
        ]
    });

    if(existingUser) {
        return res.status(411).json({
            "message": "User already exists"
        })
    }

    const user = await User.create({
        username: data.username,
        password: data.password,
        email: data.email
    })

    const userId = user._id;
    
    const token = jwt.sign({userId}, JWT_SECRET)

    return res.status(200).json({
        message: "Successfully created",
        token: token
    })

});

//2. User login using password and username
const signIn = z.object({
    username: z.string(),
    password: z.string()
});

app.post("/signin", async (req, res) => {
    const { success } = signIn.safeParse(req.body);


    if(!success) {
        return res.status(411).json({
            "message" : "Invalid inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username,
        password: req.body.password
    });

    if(!existingUser) {
        return res.status(403).json({
            "message": "invalid credentials"
        })
    }

    const userId = existingUser._id;

    const token = jwt.sign({userId}, JWT_SECRET);

    return res.status(200).json({
        "message": "Login successful",
        token: token
    })
});

//3. Forgot password 

const forgotPass = z.object({
    username: z.string(),
})

app.put("/forgotpassword", authMiddleware, async (req, res) => {
    const { success } = forgotPass.safeParse(req.query);

    if(!success) {
        return res.status(411).json({
            "message": "Invalid input"
        })
    }

    const existingUser = await User.findOne({
        username: req.query.username
    });

    if(!existingUser) {
        return res.status(403).json({
            "message": "Invalid username"
        })
    }

    const updatedPassword = await User.updateOne({
        username: req.query.username
    }, {
        password: req.body.password
    })

    if(!updatedPassword) {
        return res.status(411).json({
            "message": "error while updating"
        })
    }

    return res.status(200).json({
        "message": "Successfully updated"
    })
})

//4. To get all the posts 
app.get('/posts', authMiddleware, async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

// 5. To get all posts related to the user
app.get('/posts/:user', authMiddleware, async (req, res) => {
    const user = req.params.user;

    const existingUser = await User.findOne({
        username: user
    });

    if(!existingUser) {
        return res.status(411).json({
            message: "Unable to retrieve the posts"
        })
    }

    const posts = await Post.find({
        user: existingUser._id
    })

    res.json(posts);
});

// 6. To create posts
app.post('/posts', authMiddleware, async (req, res) => {
    try {
        const user = req.query.username;
        const content = req.body.content;

        const existingUser = await User.findOne({
            username: user
        });

        if(!existingUser) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const post = await Post.create({
            user: existingUser._id,
            content: content
        })

        return res.json({
            message: "Post created successfully"
        })


    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
});

// 7. To update posts of a user
app.put('/posts/:postId', authMiddleware, async (req, res) => {
    try {

        const postId = req.params.postId;
        const content = req.body.content;
    
        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "Invalid postId" });
        }
    
        const updatedPost = await Post.findOneAndUpdate(
            { _id: postId },
            { $set: { content: content, updatedAt: new Date() } },
            { new: true }
        );
    
        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }
    
        return res.status(200).json({
            message: "Post updated successfully"
        })
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

    
});

// 8. To delete the post
app.delete('/posts/:postId', authMiddleware, async (req, res) => {
    const postid = req.params.postId;

    if (!ObjectId.isValid(postid)) {
        return res.status(400).json({ message: "Invalid postId" });
    }

    const existingPost = await Post.findById(postid);

    if(!existingPost) {
        return res.status(404).json({
            message: "Post not found"
        })
    }

    await Post.deleteOne({
        _id: new ObjectId(postid)
    })

    return res.json({
        message: "Post deleted successfully"
    })
});

// 9. To like a post
app.post('/posts/:postId/like', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;

        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "Invalid postId" });
        }
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const user = await User.findOne({
            username: req.body.username
        })

        const userId = user._id;


        if (post.likes.includes(userId)) {
            return res.status(400).json({ message: "User already liked this post" });
        }

        post.likes.push(userId);

        await post.save();

        return res.status(200).json({ message: "Post liked successfully", post });
    } catch (error) {
        console.error("Error liking post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//10. To comment on a post
app.post('/posts/:postId/comments', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;

        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "Invalid postId" });
        }
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const user = await User.findOne({
            username: req.body.username
        })

        const userId = user._id;
        const text = req.body.text;

        const comment = {
            user: userId,
            text: text,
            createdAt: new Date()
        }

        post.comments.push(comment);

        await post.save();

        return res.status(200).json({ message: "Comment added successfully", post });
    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
})

app.listen(3000)