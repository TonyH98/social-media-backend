const express = require("express")

const  {searchPost} = require("../queries/searchPost")

const search = express.Router()


search.get("/:tagName", async (req , res) => {

    const {tagName} = req.params

    try{
        const getPosts = await searchPost(tagName)

        res.json(getPosts)
    }

    catch(error){
        res.json(error)
    }

})


module.exports = search
