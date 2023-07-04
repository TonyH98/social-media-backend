const express = require("express");
const interests = express.Router();

const {getAllInterests , getInterets} = require("../queries/interests")


interests.get("/", async (req, res) => {
    const allInterests = await getAllInterests();
    if (allInterests[0]) {
        res.status(200).json(allInterests);
    } else {
        res.status(500).json({ error: "server error!"});
    }
});


interests.get("/:id", async(req , res) => {
    const {id} = req.params

    const interest = await getInterets(id)

    if(!interest.message){
        res.json(category)
    }
    else {
        res.status(500).json({ error: "Interest not found!"});
    }
})

module.exports = interests