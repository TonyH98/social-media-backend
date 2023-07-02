const express = require("express")

const {getAllTags} = require("../queries/hashtags")

const tags = express.Router()


tags.get("/", async (req , res) => {

    try{
        const getTags = await getAllTags()
        res.json(getTags)
    }
    catch(error){
        console.log(error)
        return error 
    }
})


module.exports = tags