const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("./user");
const MY_KEY = "nigga";
const MY_REFRESH_KEY = "nigga2";
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
        let access_token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_KEY, {
            expiresIn: "10s"
        })
        let refresh_token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_REFRESH_KEY, {
            expiresIn: "20s"
        });

        console.log(access_token);
        res.cookie("access_token", access_token, {
            maxAge: new Date(Date.now() + 1000 * 10)
        });
        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            maxAge: new Date(Date.now() + 1000 * 60)
        })
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
            console.log("Inside if");
            let access_token = jwt.sign({ _id: uD._id, username: uD.username }, MY_KEY, {
                expiresIn: "10s"
            });
            let refresh_token = jwt.sign({ _id: uD._id, username: uD.username }, MY_REFRESH_KEY, {
                expiresIn: "20s"
            });
            console.log(access_token);
            console.log(refresh_token);
            // res.set("authorisation",`Bearer ${token}`)
            res.cookie("access_token", access_token, {
                maxAge: new Date(Date.now() + 1000 * 10)
            });
            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                maxAge: new Date(Date.now() + 1000 * 60)
            })
            return res.redirect("/home");
        }
        return res.send("Password is wrong");
    }
    catch (err) {
        res.status(500).send(err);
    }
})
app.get("/home", async (req, res) => {
    try {
        let access_token = req.cookies.access_token;
        let refresh_token = req.cookies.refresh_token;
        console.log(refresh_token);

        if (!access_token && !refresh_token) {
            return res.send("You are not authenticated!");
        }

        if (access_token || refresh_token) {
            if (access_token) {
                jwt.verify(access_token, MY_KEY, async (err, data) => {
                    if (err) {
                        console.log(err);
                        console.log("/n ----SOO USES YOUR REFRESH TOKEN--------- /n");

                        jwt.verify(refresh_token, MY_REFRESH_KEY, async (err, data) => {
                            if (err) {
                                res.send("YOUR REFRESH EXPIRED KINDLY LOGIN!");
                            } else {
                                console.log(data);
                                let registeredUser = await user.findOne({ username: data.username });
                                if (registeredUser) {
                                    res.clearCookie("access_token");
                                    res.clearCookie("refresh_token");

                                    let access_token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_KEY, {
                                        expiresIn: "10s"
                                    });
                                    let refresh_token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_REFRESH_KEY, {
                                        expiresIn: "20s"
                                    });

                                    res.cookie("access_token", access_token, {
                                        httpOnly: true,
                                        maxAge: 1000 * 60 * 60
                                    });
                                    res.cookie("refresh_token", refresh_token, {
                                        httpOnly: true,
                                        maxAge: 1000 * 60 * 60
                                    });

                                    res.send(`You are using refresh token, so I refreshed your access and refresh tokens: /n ${data}`);
                                } else {
                                    res.send("Kindly login again");
                                }
                            }
                        });
                    } else {
                        let userD = await user.findOne({ username: data.username });
                        if (userD) {
                            req.user = data;
                            res.send(req.user);
                        } else {
                            res.send("Such user was deleted!");
                        }
                    }
                });
            } else if (refresh_token) {
                jwt.verify(refresh_token, MY_REFRESH_KEY, async (err, data) => {
                    if (err) {
                        res.send("YOUR REFRESH EXPIRED KINDLY LOGIN!");
                    } else {
                        console.log(data);
                        let registeredUser = await user.findOne({ username: data.username });
                        if (registeredUser) {
                            res.clearCookie("access_token");
                            res.clearCookie("refresh_token");

                            let access_token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_KEY, {
                                expiresIn: "10s"
                            });
                            let refresh_token = jwt.sign({ _id: registeredUser._id, username: registeredUser.username }, MY_REFRESH_KEY, {
                                expiresIn: "20s"
                            });

                            res.cookie("access_token", access_token, {
                                httpOnly: true,
                                maxAge: 1000 * 60 * 60
                            });
                            res.cookie("refresh_token", refresh_token, {
                                httpOnly: true,
                                maxAge: 1000 * 60 * 60
                            });

                            res.send(`You are using refresh token, so I refreshed your access and refresh tokens: /n ${data}`);
                        } else {
                            res.send("Kindly login again");
                        }
                    }
                });
            }
        } else {
            res.send("Please send required headers");
        }
    } catch (err) {
        console.log(err);
    }
});
app.listen(5000, (req, res) => {
    console.log("Server is listeing to 5000...");
});