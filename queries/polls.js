const db = require("../db/dbConfig")

const getPolls = async (user_id) => {
    try{
        const allPolls = await db.any(
            `SELECT * FROM polls WHERE polls.user_id = $1`
        )
        return allPolls
    }
    catch(error){
        console.log(error)
        return error
    }
}

const getPoll = async (id) => {
    try{
        const allPolls = await db.one(
            `SELECT * FROM polls WHERE polls.id = $1`
        )
        return allPolls
    }
    catch(error){
        console.log(error)
        return error
    }
}

const createPoll = async (poll) => {
    try{
        const createPolls = await db.one(
            `INSERT INTO polls (question , options, user_id, expiry_date) VALUES ($1 , $2, $3, $4)`,
            [poll.question, poll.options, poll.user_id, poll.expiry_date]
        )
        return createPolls
    }
    catch(error){
        console.log(error)
        return error
    }
}

const votePoll = async (pollId) => {
    try{
        const updatePoll = await db.one(
            'UPDATE polls SET options = jsonb_set(options, \'{values, 0, count}\', (COALESCE(options->\'values\'->0->>\'count\', \'0\')::INT + 1)::TEXT::JSONB) WHERE id = $1 RETURNING *',
            [pollId]
        )
        return updatePoll
    }
    catch(error){
        console.log(error)
        return error
    }
}

module.exports = {
    getPolls,
    getPoll,
    createPoll,
    votePoll,
};