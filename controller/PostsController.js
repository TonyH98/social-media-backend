const express = require("express")

const {getAllPosts, createPost, updatePost, deletePosts, createReaction, getReaction} = require("../queries/Posts")


const posts = express.Router({mergeParams: true})

posts.get("/", async (req , res) => {

const {username} = req.params

try{
    const allPosts = await getAllPosts(username)
    res.json(allPosts)
}
catch(error){
    res.json(error)
}

})

posts.post("/", async (req , res) => {
    try{
        const post = await createPost(req.body)
        res.json(post)
    }
    catch(error){
        res.status(400).json({ error: error });
    }
})


posts.delete("/:id", async (req , res) => {
    const {id} = req.params
    const deletePost = await deletePosts(id)
    if(deletePost.id){
        res.status(200).json(deletePost)
    }
    else{
        res.status(404).json("Post not found")
    }
})


posts.put("/:id", async (req , res) => {
    const {id} = req.params;

    const updatedPost = await updatePost(id, req.body);

    res.status(200).json(updatedPost);
})


posts.post("/:userId/react/:postId", async (req , res) => {
    try{

        const {userId , postId} = req.params

        const createReactions = await createReaction(req.body, userId, postId)

        res.json(createReactions)

    }
    catch(error){
        console.log(error)
        return error
    }
})


posts.get("/reaction/:id" , async (req , res) => {

    const {username, id} = req.params

    try{
        const allReaction = await getReaction(username, id)
        res.json(allReaction)
    }
    catch(error){
        res.json(error)
    }


})

module.exports = posts