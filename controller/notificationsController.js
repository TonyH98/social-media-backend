const express = require("express")

const  {getAllPostNotifications, deleteNotifications, getAllReplyNotifications} = require("../queries/notifications")



const note = express.Router()

note.get("/:id/posts", async(req , res) => {

    const {id} = req.params

    try{
        const allNote = await getAllPostNotifications(id)
        res.json(allNote)
    }
    catch(error){
        res.json(error)
    }


})


note.delete("/:id", async (req , res) => {
    const {id} = req.params
    const deleteNote = await deleteNotifications(id)
    if(deleteNote.id){
        res.status(200).json(deleteNote)
    }
    else{
        res.status(404).json("Notifications not found")
    }
})


note.get("/:id/reply", async(req , res) => {

    const {id} = req.params

    try{
        const allNote = await getAllReplyNotifications(id)
        res.json(allNote)
    }
    catch(error){
        res.json(error)
    }


})

module.exports = note
