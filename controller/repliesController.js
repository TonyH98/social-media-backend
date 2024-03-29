const express = require("express")

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const {createReply, getReplies, createReactionR, getReaction} = require("../queries/replies")

const reply = express.Router({mergeParams: true})

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


reply.post("/", upload.array('posts_img', 4), async (req , res) => {
    try{
        const post = await createReply(req.body)
        res.json(post)
    }
    catch(error){
        res.status(400).json({ error: error });
    }
})





reply.post("/:userId/reactR/:replyId", async (req , res) => {
  try{
      const { userId, replyId} = req.params;
      const { reaction, creator_id } = req.body; 

      const createReactions = await createReactionR(reaction, creator_id, userId, replyId);

      res.json(createReactions);
  }
  catch(error){
      console.log(error);
      res.status(500).json({ error: "An error occurred." });
  }
});



reply.get("/:id/reactionsR" , async (req , res) => {

  const {id} = req.params
  try{
    const allReaction = await getReaction(id)

      res.json(allReaction)
  }
  catch(error){
      res.json(error)
  }


})




module.exports = reply
