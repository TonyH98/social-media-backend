
const db = require("../db/dbConfig")

const nodemailer = require('nodemailer')

const password = process.env.Email_Password


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


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'tonyhoangtesting@gmail.com',
      pass: password
    }
  });


  async function sendEmail(toEmail, firstName, username) {
    const info = await transporter.sendMail({
      from: 'Tony Hoang <tonyhoangtesting@gmail.com>',
      to: toEmail,
      subject: "Block",
      text: `Hello, ${firstName} \n @${username} has blocked you.`
    });
  
    console.log("Message sent: " + info.messageId);
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
                    `DELETE FROM favorite WHERE 
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
               
                const blockUser = await db.one(
                    `SELECT firstname, email, notifications FROM users WHERE id = $1`,
                    [blockId]
                )

                const user = await db.one(
                    `SELECT username FROM users WHERE id = $1`,
                    [userId]
                )

                if(blockUser.notifications){
                    await sendEmail(blockUser.email, blockUser.firstname, user.username)
                }
            
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
    