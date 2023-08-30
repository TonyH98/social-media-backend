const db = require("../db/dbConfig")
const nodemailer = require('nodemailer')

const password = process.env.Email_Password

const getReplies = async (postId) => {
    try{
        const allReplies = await db.any(
            `SELECT r.id, r.posts_id, r.content, to_char(r.date_created, 'MM/DD/YYYY') AS time,
            json_build_object(
                'id', r.user_id,
                'username', users.username,
                'firstname', users.firstname,
                'lastname', users.lastname,
                'profile_name', users.profile_name,
                'profile_img', users.profile_img
            ) AS creator
        FROM replies r 
        JOIN users ON users.id = r.user_id
        WHERE r.posts_id = $1
        GROUP BY r.id, r.posts_id, users.username, users.firstname, users.lastname, users.profile_name, users.profile_img;
        
            `, postId

        );
        return allReplies
    }
    catch(error){
        console.log(error)
        return error
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
  
  async function sendEmail(toEmail, firstName) {
    const info = await transporter.sendMail({
      from: 'Tony Hoang <tonyhoangtesting@gmail.com>',
      to: toEmail,
      subject: "Post Mention",
      text: `Hello, ${firstName} \n Someone has mentioned you in a new post! \n Do not respond to this email as it is automatically generated.`
    });
  
    console.log("Message sent: " + info.messageId);
  }



const createReply = async (post) => {
   
    try {
        const addPost = await db.tx(async (t) => {
          const insertedPost = await t.one(
            'INSERT INTO replies (posts_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
            [post.posts_id , post.user_id, post.content]
          );
    
          const mentionedUsers = post.content.match(/@(\w+)/g);
          if (mentionedUsers) {
            for (const mention of mentionedUsers) {
              const username = mention.substring(1);
              const user = await db.oneOrNone(
                'SELECT id, email, firstname, notifications FROM users WHERE username = $1',
                username
              );
    
              if (user) {
                await db.none(
                  'INSERT INTO notifications (users_id, reply_id, is_read, sender_id, selected) VALUES ($1, $2, $3, $4, $5)',
                  [user.id, addPost.id, false, addPost.user_id, false]
                );
    
                if (user.notifications) {
                  await sendEmail(user.email, user.firstname);
                }
              }
            }
          }
    
          const hashtags = post.content.match(/#(\w+)/g);
          if (hashtags) {
            for (const hash of hashtags) {
              try {
                const insertedHashtag = await t.one(
                  'INSERT INTO hashtags (tag_names) VALUES ($1) ON CONFLICT (tag_names) DO UPDATE SET tag_names = $1 RETURNING id',
                  hash
                );
    
                await t.none(
                  'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                  [insertedPost.id, insertedHashtag.id, post.user_id]
                );
              } catch (error) {
                if (error.code !== '23505') {
                  throw error;
                }
              }
            }
          }
    
          return insertedPost;
        });
    
        return addPost;
      } catch (error) {
        console.log(error);
        return error;
      }



};

const deleteReply = async (id) => {
    try{
        const deletePost = await db.one(
            'DELETE FROM replies WHERE id = $1 RETURNING *', id
        )
        return deletePost
    }
    catch(error){
        return error
    }
}

module.exports = {deleteReply , createReply, getReplies}