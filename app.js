const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("./user");
const MY_KEY = "nigga";
const cookieParser = require("cookie-parser");
mongoose.connect("mongodb://127.0.0.1:27017/jwt").then(() => {
    console.log("Connected to mongoDB");
});
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.json())

app.get("/register", (req, res) => {
    res.render("register")
});
app.post("/register", async (req, res) => {
    try {
        let { username, password } = req.body;
        console.log(username, password);

        let nU = new user({ username, password });
        let registeredUser = await nU.save();
        console.log("user saved succesfully:-", registeredUser);
        let token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_KEY, {
            expiresIn: "1000s"
        });
        console.log(token);
        res.cookie("token", token, {
            expires: new Date(Date.now() + 5000)
        });
        // res.set("authorisation",`Bearer ${token}`);
        res.redirect("/home");
    }
    catch (err) {
        console.log(err);
    }
});
app.get("/login", (req, res) => {
    res.render("login");
})
app.post("/login", async (req, res) => {
    try {
        let { username, password } = req.body;
        console.log(password);

        let uD = await user.findOne({ username: username });
        if (!uD) {
            return res.send("Username not exists");
        }
        let result = await bcryptjs.compare(password, uD.password);
        console.log(result);
        console.log("working///");
        if (result) {
            let token = jwt.sign({ id: uD._id, username: uD.username }, MY_KEY, {
                expiresIn: "1000s"
            })
            // res.set("authorisation",`Bearer ${token}`)
            res.cookie("token", token,{
                maxAge:Date.now()+1000*1000
            });
            return res.redirect("/home");
        }
        return res.send("Password is wrong")
    }
    catch (err) {
        res.status(500).send(err)
    }
})
app.get("/home", async (req, res) => {
    try {
        // console.log("Home route");
        // console.log(req.headers);
        let token = req.cookies.token
        if (!token) {
            return res.send("You are not autheticated!")
        }
        if (token) {
            jwt.verify(token, MY_KEY, async (err, data) => {
                if (err) {
                    console.log(err);
                    return res.send("Invalid JWT or token expied!")
                }
                else {
                    let userD = await user.findOne({ username: data.username })
                    if (userD) {
                        req.user = data
                        res.send(req.user)
                    }
                    else {
                        res.clearCookie("token");
                        res.send("Such User was deleted!")
                    }
                }
            })
        }
        else {
            res.send("Please send required headers");
        }

    }
    catch (err) {
        console.log(err);
    }
})
app.listen(8000, (req, res) => {
    console.log("SErver 2 is listeing to 8000...");

})