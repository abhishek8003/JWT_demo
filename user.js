const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs")
const userSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String
    }
});
userSchema.pre("save", async function (next) {
    try{
        let hashedPassword = await bcryptjs.hash(this.password, 10);
        // console.log(hashedPassword);
        this.password=hashedPassword;
        next();
    }
    catch(err){
        next(err)
    }
});
module.exports = mongoose.model("user", userSchema)