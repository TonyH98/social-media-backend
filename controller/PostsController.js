const express = require("express")

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');


const {getAllPosts, getPost, createPost, deletePosts, createReaction, getReaction} = require("../queries/Posts")


const posts = express.Router({mergeParams: true})

const reply = require("./repliesController")

posts.use("/:postId/reply", reply)



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './Images');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + uuidv4();
      const extension = path.extname(file.originalname);
      cb(null, uniqueSuffix + extension);
    }
  });
  
  const upload = multer({
    storage,
    limits: {
      fileSize: Infinity
    },
  });





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


posts.get("/:id", async (req , res) => {

    const {username, id} = req.params
    
    try{
        const post = await getPost(username, id)
        res.json(post)
    }
    catch(error){
        res.json(error)
    }
    
    })



posts.post("/", upload.single('posts_img'), async (req , res) => {
    try{
        const post = await createPost(req.body)
        res.json(post)
    }
    catch(error){
        console.log(error)
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

posts.post("/:userId/react/:postId", async (req , res) => {
    try{
        const { userId, postId } = req.params;
        const reaction = req.body.reaction; 

        const createReactions = await createReaction(reaction, userId, postId);

        res.json(createReactions);
    }
    catch(error){
        console.log(error);
        res.status(500).json({ error: "An error occurred." });
    }
});



posts.get("/:id/reactions" , async (req , res) => {

    const {id} = req.params

    try{
        const allReaction = await getReaction(id)
        res.json(allReaction)
    }
    catch(error){
        res.json(error)
    }


})

module.exports = posts