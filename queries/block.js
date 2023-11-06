
const db = require("../db/dbConfig")


const getBlock = async (userId, blockId) => {
    try {
        const usersBlock = await db.one(
            `SELECT block_id FROM users_block WHERE users_block.user_id = $1 AND users_block.block_id = $2 `,
            [userId, blockId]
        );
        return usersBlock ;
    } catch (error) {
        console.log(error);
        return []
    }
};


const addBlock = async (userId, blockId) => {

    try{
        const addBlock= await db.one(
            `INSERT INTO users_block (user_id , block_id) VALUES ($1, $2)`,
            [userId, blockId]
        )

        return addBlock
    }
    catch(error){
        console.log(error)
        return error
    }
    
    }

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
        getBlock, addBlock, removeBlock
    }
    