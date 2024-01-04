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



const createPoll = async (poll) => {
    try {
      const createPolls = await db.one(
        `INSERT INTO polls (question , options, user_id) VALUES ($1 , $2, $3) RETURNING *`,
        [poll.question, JSON.stringify(poll.options), poll.user_id]
      );
      return createPolls;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  
  const voteOnPoll = async (pollId, userId, selectedOption) => {
    try {
        // Check if the user has already voted
        const existingVote = await db.oneOrNone(
            'SELECT selected_option FROM poll_votes WHERE poll_id = $1 AND user_id = $2',
            [pollId, userId]
        );

        if (existingVote) {
            // User has already voted
            if (existingVote.selected_option !== selectedOption) {
                // User is changing their vote
                const query = `
                    WITH updated_vote AS (
                        UPDATE poll_votes
                        SET selected_option = $1
                        WHERE poll_id = $2 AND user_id = $3
                        RETURNING *
                    )
                    UPDATE polls
                    SET options = (
                        SELECT jsonb_agg(
                            CASE
                                WHEN option->>'text' = $1
                                    THEN jsonb_build_object('text', option->>'text', 'count', ((option->>'count')::int + 1)::text)
                                WHEN option->>'text' = $4
                                    THEN jsonb_build_object('text', option->>'text', 'count', ((option->>'count')::int - 1)::text)
                                ELSE
                                    option
                            END
                        )
                        FROM jsonb_array_elements((SELECT options FROM polls WHERE id = $2)::jsonb) option
                    )
                    WHERE id = $2
                    RETURNING *;
                `;

                const result = await db.tx(async (t) => {
                    const voteUpdate = await t.oneOrNone(query, [selectedOption, pollId, userId, existingVote.selected_option]);
                    return voteUpdate;
                });

                return result;
            } else {
                // User selected the same option again, no need to update
                return { message: 'User selected the same option again.' };
            }
        } else {
            // User hasn't voted yet, insert a new vote
            const query = `
                WITH updated_vote AS (
                    INSERT INTO poll_votes (poll_id, user_id, selected_option)
                    VALUES ($2, $3, $1)
                    ON CONFLICT (poll_id, user_id) DO UPDATE
                    SET selected_option = $1
                    RETURNING *
                )
                UPDATE polls
                SET options = (
                    SELECT jsonb_agg(
                        CASE
                            WHEN option->>'text' = $1
                                THEN jsonb_build_object('text', option->>'text', 'count', ((option->>'count')::int + 1)::text)
                            ELSE
                                option
                        END
                    )
                    FROM jsonb_array_elements((SELECT options FROM polls WHERE id = $2)::jsonb) option
                )
                WHERE id = $2
                RETURNING *;
            `;

            const result = await db.tx(async (t) => {
                const voteUpdate = await t.oneOrNone(query, [selectedOption, pollId, userId]);
                return voteUpdate;
            });

            return result;
        }
    } catch (error) {
        console.log(error);
        return error;
    }
};





module.exports = {
    getPolls,
    createPoll,
    voteOnPoll
};