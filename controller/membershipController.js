const express = require("express")

const {getAllMembershipsPlans , getMembershipPlan , getUserMembership, addMemebership} = require("../queries/membership")

const plans = express.Router()


plans.get("/", async (req , res) => {

try{

    const allPlans = await getAllMembershipsPlans()
    res.json(allPlans)
}
catch(error){
    res.json(error)
}

})


plans.get("/:id", async (req , res) => {

const {id} = req.params


    const getPlan = await getMembershipPlan(id)


    if(getPlan){
        res.json(getPlan)
    }
    else{
        res.status(404).json({error: "Plan not Found"})
    }


})


plans.get("/:userId/plan/:planId", async (req , res) => {

const {userId , planId} = req.params

const getUserPlan = await getUserMembership(userId , planId)


try{
    
if(getUserPlan){
    res.json(getUserPlan)
}

}
catch(error){
    res.json(error)
}

})

plans.post("/:userId/plan/:planId", async (req , res) => {

    const {userId , planId} = req.params
    try{

        const plan = await addMemebership(userId , planId)
        res.json(plan)

    }

    catch(error){
        res.status(400).json({ error: error });
    }

})


module.exports = plans