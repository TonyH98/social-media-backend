const express = require("express")

const { getPolls,
        createPoll,
        voteOnPoll,
        getUserVotes,
        allVotes} = require("../queries/polls")

const poll = express.Router({mergeParams: true})

const reply = require("./repliesPollController")

poll.use("/:pollId/reply", reply)


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


 poll.put("/:pollId/check/:userId", async (req, res) => {
    try {
        const { pollId, userId } = req.params;
        const selectedOption = req.body.selected_option; // Assuming selected_option is the key in your request body

        if (!selectedOption) {
            return res.status(400).json({ error: 'Selected option is required in the request body' });
        }

        const vote = await voteOnPoll(pollId, userId, selectedOption);

        res.status(200).json(vote);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

poll.get("/:userId/votes/:pollId", async (req , res) => {
    const {userId, pollId} = req.params
    
    try{
        const votes = await getUserVotes(userId, pollId)
        res.json(votes)
    }
    catch(error){
        console.log(error)
        return error
    }
})

poll.get("/:pollId/votes", async (req , res) => {
    const {pollId} = req.params
    
    try{
        const votes = await allVotes( pollId)
        res.json(votes)
    }
    catch(error){
        console.log(error)
        return error
    }
})

module.exports = poll