const express = require("express")

const { getBlock, addBlock, removeBlock, getUserBlockTheMainuser } = require("../queries/block")

const block = express.Router()

block.get("/:userId", async (req , res) =>{
    
    const {userId} = req.params
    
    try{
        const block = await getBlock(userId)
        res.json(block)
    }
    catch(error){
        console.log(error)
        return error
    }
     
})

block.get("/:blockId/block", async (req , res) =>{
    
    const {blockId} = req.params
    
    try{
        const block = await getUserBlockTheMainuser(blockId)
        res.json(block)
    }
    catch(error){
        console.log(error)
        return error
    }
     
})



block.post("/:userId/block/:blockId", async (req , res) => {

    const {userId , blockId} = req.params
    
    try{
        const block = await addBlock(userId , blockId)
    
        res.json(block)
    }
    
    catch(error){
        console.log(error)
        res.status(400).json({ error: error });
    }
    })


    block.delete("/:userId/deleteBlock/:blockId", async (req , res) => {
   
        const {userId, blockId} = req.params
    
        const deleteBlock = await removeBlock(userId, blockId)
    
        if(deleteBlock){
            res.status(200).json(deleteBlock)
        }
    
    
    })


    module.exports = block