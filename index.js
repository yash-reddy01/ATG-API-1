const express = require("express");
const User = require("./db");
const z = require("zod");


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

    await User.create({
        username: data.username,
        password: data.password,
        email: data.email
    })

    return res.status(200).json({
        "message": "Successfully created"
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

    return res.status(200).json({
        "message": "Login successful"
    })
});

//3. Forgot password 

const forgotPass = z.object({
    username: z.string(),
})

app.put("/forgotpassword", async (req, res) => {
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

app.listen(3000)