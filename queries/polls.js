const db = require("../db/dbConfig")

const nodemailer = require('nodemailer');


const password = process.env.Email_Password

const getPolls = async (user_id) => {
    try {
        const allPolls = await db.any(
            `SELECT 
                p.id,
                p.question,
                p.answer,
                p.options,
                to_char(p.date_created, 'MM/DD/YYYY') AS time,
                json_build_object(
                    'id', p.id,
                    'username', p.user_name,
                    'profile_name', u.profile_name,
                    'profile_img', u.profile_img,
                    'user_id', p.user_id
                ) AS creator,
                (SELECT options FROM polls WHERE id = p.id) AS votes
             FROM 
                polls p
             JOIN 
                users u ON u.id = p.user_id
             WHERE 
                p.user_id = $1
             ORDER BY p.id DESC`,
            user_id
        );

        // Calculate total votes for each poll
        const pollsWithVotes = allPolls.map((poll) => {
            const totalVotes = poll.votes.reduce((sum, option) => sum + parseInt(option.count, 10), 0);
            return { ...poll, totalVotes };
        });

        return pollsWithVotes;
    } catch (error) {
        console.error('Error in getPolls:', error);
        throw error;
    }
};



const getPoll = async (pollId) => {
    try {
        const poll = await db.one(
            `SELECT 
                p.id,
                p.question,
                p.answer,
                p.options,
                to_char(p.date_created, 'MM/DD/YYYY') AS time,
                json_build_object(
                    'id', p.id,
                    'username', p.user_name,
                    'profile_name', u.profile_name,
                    'profile_img', u.profile_img,
                    'user_id', p.user_id
                ) AS creator,
                (SELECT options FROM polls WHERE id = p.id) AS votes
             FROM polls p
             JOIN users u ON u.id = p.user_id
             WHERE p.id = $1`,
            pollId
        );
       
            const totalVotes = poll.votes.reduce((sum, option) => sum + parseInt(option.count, 10), 0);
            return { ...poll, totalVotes };
        
        
    } catch (error) {
        console.error('Error in getPolls:', error);
        throw error;
    }
};


const createPoll = async (poll) => {
    let addPoll = null
    try {
    addPoll = await db.tx(async (t) => {
        const createPolls = await t.one(
            `INSERT INTO polls (question , options, user_id, user_name, answer) VALUES ($1 , $2, $3, $4, $5) RETURNING *`,
            [poll.question, JSON.stringify(poll.options), poll.user_id, poll.user_name, poll.answer]
          );
          const hashtags = poll.question.match(/#(\w+)/g);
          if (hashtags) {
            for(const hash of hashtags){
              try{
                const existingHashtag = await db.oneOrNone(
                  `SELECT id FROM hashtags WHERE tag_names = $1`,
                  hash
                )
  
                if(!existingHashtag){
                  const insertedHashtag = await db.one(
                    `INSERT INTO hashtags (tag_names) VALUES ($1) RETURNING *`,
                    hash
                  )
                  await t.none(
                    'INSERT INTO post_hashtags (poll_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                    [createPolls.id, insertedHashtag.id, poll.user_id]
                  )
                }
                else{
                  await t.none(
                    'INSERT INTO post_hashtags (poll_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                    [createPolls.id, existingHashtag.id, poll.user_id]
                  );
                }
              }
              catch(error){
                if (error.code !== '23505') {
                  throw error;
                }
              }
            }
            return createPolls
          }
       
    })

    return addPoll
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


const getUserVotes = async (userId, pollId) => {
    try {
        const allVotes = await db.one(
            `SELECT selected_option , poll_id FROM poll_votes WHERE user_id =$1 AND poll_id = $2 `,
            [userId, pollId]
        );
        return allVotes
    } catch (error) {
        console.error(error);
        throw error;
    }
}





module.exports = {
    getPolls,
    getPoll,
    createPoll,
    voteOnPoll,
    getUserVotes
};