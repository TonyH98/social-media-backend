const express = require("express")

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');


const {getAllPosts,
     getPost, 
     createPost,
      deletePosts,
       createReaction,
        getReaction, 
        getAllUsersReplies,
         createRepost,
        editPosts} = require("../queries/Posts")


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
        fileSize: Infinity, // No limit on file size
        fieldSize: Infinity, // No limit on field size
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


posts.get("/:id/replies", async (req , res) => {
    const {id} = req.params

    try{
        const getAllReplies = await getAllUsersReplies(id)
        res.json(getAllReplies)
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



    posts.post("/", upload.array('posts_img'), async (req, res) => {
        try {
            
           
            const post = {
                ...req.body,
                posts_img: req.body.posts_img
            };
            const createdPost = await createPost(post);
            res.json(createdPost);
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: "Failed to create post" });
        }
    });
    


posts.post("/:username/repost/:postId", async (req , res) => {
    const {username, postId} = req.params

    try{
        const post = await createRepost(username , postId, req.body)
        if(post === "Already executing..."){
            return res.status(409).json({ error: "Request is being processed." });
        }
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

posts.post("/:userId/react/:postId", async (req, res) => {
    try {
      const { userId, postId } = req.params;
      const { reaction, creator_id } = req.body; 
      console.log(creator_id, userId, postId, reaction)
      const createReactions = await createReaction(reaction, creator_id, userId, postId);
  
      res.json(createReactions);
    } catch (error) {
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



posts.put("/:id", async (req , res) => {

    const { id } = req.params;
      
    const edit = await editPosts(id, req.body);

    res.status(200).json(edit);

})


module.exports = posts