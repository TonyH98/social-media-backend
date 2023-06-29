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


const getUserMembership = async (userId, planId) => {
    try{
        const userMemeber = await db.one(
            `SELECT um.user_id, um.membership_id, um.date_created, m.product_name
            FROM users_memberships um
            JOIN users u ON u.id = um.user_id
            JOIN memberships m ON m.id = um.memberships_id
            WHERE um.users_id =$1 AND um.memberships_id =$2`,
            [userId , planId]
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
            `INSERT INTO users_memberships (user_id , membership_id) VALUES($1 , $2)`,
            [userId , planId]
        )
        return !add
    }
    catch(error){
        console.log(error)
        return error
    }
}

module.exports ={getAllMembershipsPlans , getMembershipPlan , getUserMembership, addMemebership}
