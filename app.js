const express = require('express')

const cors = require('cors')

const app = express()

app.use(cors())

app.use(express.json())

const user = require("./controller/UsersController")

const note = require("./controller/notificationsController")

const favorite = require("./controller/favoritesController")

const follow = require("./controller/followController")

app.use("/", (req , res) => {
    res.send("Welcome to the social media app")
})

app.use("/users", user)

app.use("/notifications", note)

app.use("/favorites", favorite)

app.use("/follow", follow)


module.exports = app