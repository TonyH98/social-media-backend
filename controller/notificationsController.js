const express = require("express")

const  {getAllNotifications,deleteNotifications} = require("../queries/notifications")



const note = express.Router()

note.get("/:id", async(req , res) => {

    const {id} = req.params

    try{
        const allNote = await getAllNotifications(id)
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


module.exports = note
