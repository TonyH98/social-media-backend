const express = require("express")

const { getPolls,
        createPoll,
        voteOnPoll} = require("../queries/polls")

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

module.exports = poll