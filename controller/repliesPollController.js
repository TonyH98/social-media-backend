const express = require("express")

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const {createReply, getReplies} = require("../queries/replyPoll")

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

    const {pollId} = req.params
    
    try{
        const allReplies = await getReplies(pollId)
        res.json(allReplies)
    }
    catch(error){
        console.log(error)
        res.json(error)
    }
    
    })
    
    
    reply.post("/", upload.single('posts_img'), async (req , res) => {
        try{
            const post = await createReply(req.body)
            res.json(post)
        }
        catch(error){
            res.status(400).json({ error: error });
        }
    })
    
module.exports = reply