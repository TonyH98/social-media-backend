
const db = require("../db/dbConfig")


const getBlock = async (userId) => {
    try {
        const usersBlock = await db.any(
            `SELECT block_id FROM users_block WHERE users_block.user_id = $1 `,
            userId
        );
        return usersBlock ;
    } catch (error) {
        console.log(error);
        return []
    }
};


const getUserBlockTheMainuser = async (blockId) => {
    try {
        const usersBlock = await db.any(
            `SELECT user_id FROM users_block WHERE users_block.block_id = $1 `,
            blockId
        );
        return usersBlock ;
    } catch (error) {
        console.log(error);
        return []
    }
}

const addBlock = async (userId, blockId) => {
    try {
        const result = await db.tx(async (t) => {
            const insertBlock = await db.none(
                `INSERT INTO users_block (user_id, block_id) VALUES ($1, $2)`,
                [userId, blockId]
            );

            try {
                await t.manyOrNone(
                    `DELETE FROM favorite_posts WHERE 
                    (users_id = $1 AND creator_id = $2) OR 
                    (users_id = $2 AND creator_id = $1)`,
                    [userId, blockId]
                );

                await t.manyOrNone(
                    `DELETE FROM favorite_replies WHERE 
                    (users_id = $1 AND creator_id = $2) OR 
                    (users_id = $2 AND creator_id = $1)`,
                    [userId, blockId]
                );
                await t.manyOrNone(
                    `DELETE FROM post_reactions WHERE (user_id = $1 AND creator_id = $2) OR 
                    (user_id = $2 AND creator_id = $1)`,
                    [userId, blockId]
                )
                await t.manyOrNone(
                    `DELETE FROM reply_reactions WHERE (user_id = $1 AND creator_id = $2) OR 
                    (user_id = $2 AND creator_id = $1)`,
                    [userId, blockId]
                )
            
            } catch (error) {
                console.log(error);
                return error;
            }

            return insertBlock;
        });

        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
};




const removeBlock = async (userId, blockId) => {
    try{
        const deleteBlock = await db.one(
     `DELETE FROM users_block WHERE users_block.user_id = $1 AND users_block.block_id = $2`,
        [userId, blockId]
        )
        return deleteBlock
     }
     catch(error){
         console.log(error)
         return error
     }
}


    module.exports={
        getBlock, addBlock, removeBlock, getUserBlockTheMainuser
    }
    