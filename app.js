const express = require('express')

const cors = require('cors')

const app = express()

app.use(cors())

app.use(express.json())

const user = require("./controller/UsersController")

const note = require("./controller/notificationsController")

app.use("/", (req , res) => {
    res.send("Welcome to the social media app")
})

app.use("/users", user)

app.use("/notifications", note)

module.exports = app