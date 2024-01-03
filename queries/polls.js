const db = require("../db/dbConfig")

const getPolls = async (user_id) => {
    try{
        const allPolls = await db.any(
            `SELECT * FROM polls WHERE polls.user_id = $1`,
            user_id
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
            `SELECT * FROM polls WHERE polls.id = $1`, id
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



const checkVote = async (pollId, userId, selectedOption) => {
    try{
        const existingVote = await db.oneOrNone(
            `SELECTED FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
            [pollId, userId]
        )
        if(existingVote){
            await db.one(
                `UPDATE poll_votes SET selected_option = $1, 
                vote_date = CURRENT_DATE WHERE poll_id = $2 
                AND user_id = $3`,
                [selectedOption , pollId, userId]

            )
        }
        else{
            await db.none(
                `INSERT INTO poll_votes
                 (poll_id, user_id, selected_option, vote_date)
                  VALUES ($1, $2, $3, CURRENT_DATE)`,
                [pollId, userId, selectedOption]
            );
        }
        const updatedPoll = await db.one(
            'UPDATE polls SET options = jsonb_set(options, \'{values, 0, count}\', (COALESCE(options->\'values\'->0->>\'count\', \'0\')::INT + 1)::TEXT::JSONB) WHERE id = $1 RETURNING *',
            [pollId]
        );

        return updatedPoll;
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
    checkVote
};