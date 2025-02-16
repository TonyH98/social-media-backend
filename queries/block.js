
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
            // Insert block entry, ignore if it already exists
            await t.none(
                `INSERT INTO users_block (user_id, block_id) 
                VALUES ($1, $2) 
                ON CONFLICT (user_id, block_id) DO NOTHING`,
                [userId, blockId]
            );

            // Batch delete queries for performance
            await t.none(
                `DELETE FROM favorite WHERE (users_id, creator_id) IN (($1, $2), ($2, $1));
                DELETE FROM post_reactions WHERE (user_id, creator_id) IN (($1, $2), ($2, $1));
                DELETE FROM reply_reactions WHERE (user_id, creator_id) IN (($1, $2), ($2, $1));
                DELETE FROM notifications WHERE (users_id, sender_id) IN (($1, $2), ($2, $1));
                DELETE FROM users_followers WHERE (user_id, following_id) IN (($1, $2), ($2, $1));`,
                [userId, blockId]
            );

            // Fetch both user details in one query
            const userData = await t.one(
                `SELECT u1.username AS blocker_username, u2.firstname, u2.email, u2.notifications
                FROM users u1 
                JOIN users u2 ON u2.id = $2
                WHERE u1.id = $1`,
                [userId, blockId]
            );

            // Send email if blocked user has notifications enabled
            if (userData.notifications) {
                await sendEmail(userData.email, userData.firstname, userData.blocker_username);
            }

            return { success: true, message: "User blocked successfully" };
        });

        return result;
    } catch (error) {
        console.error("Error in addBlock:", error);
        return { success: false, message: "An error occurred while blocking the user" };
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
    