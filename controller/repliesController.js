const express = require("express")

const {deleteReply , createReply, getReplies} = require("../queries/replies")

const reply = express.Router({mergeParams: true})

reply.get("/", async (req , res) => {

const {postId} = req.params

try{
    const allReplies = await getReplies(postId)
    res.json(allReplies)
}
catch(error){
    console.log(error)
    res.json(error)
}

})


reply.post("/", async (req , res) => {
    try{
        const post = await createReply(req.body)
        res.json(post)
    }
    catch(error){
        res.status(400).json({ error: error });
    }
})


reply.delete("/:id", async (req , res) => {
    const {id} = req.params
    const deleteReply = await deleteReply(id)
    if(deleteReply.id){
        res.status(200).json(deleteReply)
    }
    else{
        res.status(404).json("Reply not found")
    }
})


module.exports = reply
