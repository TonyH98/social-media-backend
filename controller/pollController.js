const express = require("express")

const { getPolls,
        getPoll,
        createPoll,
        votePoll,
        checkVote} = require("../queries/polls")

const poll = express.Router()

poll.get("/:userId", async (req , res) =>{
    
    const {userId} = req.params
    
    try{
        const poll = await getPolls(userId)
        res.json(poll)
    }
    catch(error){
        console.log(error)
        return error
    }
     
})


poll.post("/", async (req , res) => {

    try{
        const poll = await createPoll(req.body)
        res.json(poll)
    }
    
    catch(error){
        console.log(error)
        res.status(400).json({ error: error });
    }
 })


poll.put("/:id", async (req , res) => {
    const { id } = req.params;
      
    const vote= await votePoll(id);

    res.status(200).json(vote);
})

module.exports = poll