const express = require("express")

const { getPolls,
        getPoll,
        createPoll,
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


poll.put("/:pollId/check/:userId", async (req , res) => {
    const { pollId , userId} = req.params;
      
    const vote= await checkVote(pollId , userId, req.body);

    res.status(200).json(vote);
})

module.exports = poll