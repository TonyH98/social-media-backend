const db = require("../db/dbConfig")

const getAllMembershipsPlans = async () =>{
    try{
        const allPlans = await db.any(`SELECT * FROM memberships`)
        return allPlans
    }
    catch(error){
        console.log(error)
        return error
    }
}

const getMembershipPlan = async (id) => {
    try{
        const getPlan = await db.one(`SELECT * FROM membership WHERE id=$1`)
        return getPlan
    }
    catch(error){
        console.log(error)
        return error
    }
}


const getUserMembership = async (userId) => {
    try{
        const userMemeber = await db.one(
            `SELECT um.user_id, um.memberships_id, um.date_created, m.product_name, m.images
            FROM users_memberships um
            JOIN users u ON u.id = um.user_id
            JOIN memberships m ON m.id = um.memberships_id
            WHERE um.user_id =$1`,
            userId
        )
        return userMemeber
    }
    catch(error){
        console.log(error)
        return error
    }
}

const addMemebership = async (userId, planId) => {
    try{
        const add = await db.none(
            `INSERT INTO users_memberships (user_id , memberships_id, quantity) VALUES($1 , $2, $3)`,
            [userId , planId, 1]
        )
        return !add
    }
    catch(error){
        console.log(error)
        return error
    }
}

module.exports ={getAllMembershipsPlans , getMembershipPlan , getUserMembership, addMemebership}
