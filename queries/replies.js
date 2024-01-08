const db = require("../db/dbConfig")
const nodemailer = require('nodemailer')

const password = process.env.Email_Password

const cheerio = require('cheerio')
const axios = require('axios')

const getReplies = async (postId) => {
    try{
        const allReplies = await db.any(
            `SELECT r.id, r.posts_id, r.content, r.gif, to_char(r.date_created, 'MM/DD/YYYY') AS time, 
            r.posts_img, r.url, r.url_title, r.url_img,
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
   let addPost = null
    try {
        addPost = await db.tx(async (t) => {

          const articleUrlMatch = post.content.match(/\bhttps?:\/\/\S+/gi);

          if(articleUrlMatch){
            const articleUrl = articleUrlMatch[0];
            const articleResponse = await axios.get(articleUrl);
            const articleHtml = articleResponse.data;
            const $ = cheerio.load(articleHtml);
    
      
            const articleTitle = $('meta[property="og:title"]').attr('content');
            const articleImage = $('meta[property="og:image"]').attr('content');
            const companyName = $('meta[property="og:site_name"]').attr('content');
    
    
            
    
    
            const postContentWithoutUrl = post.content.replace(articleUrl, '');
            
         
            const postContent = `${postContentWithoutUrl}`;

            const insertedPost = await t.one(
              'INSERT INTO replies (posts_id, user_id, content, posts_img, gif, url, url_img, url_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
              [post.posts_id , post.user_id, postContent, post.posts_img, post.gif, articleUrl, articleImage, articleTitle]
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
                  await t.one(
                    'INSERT INTO notifications (users_id, reply_id, is_read, sender_id, selected) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [user.id, insertedPost.id, false, post.user_id, false]
                  );
                if(user.notifications){
                  await sendEmail(user.email, user.firstname);
                }
                  
                }
              }
            }

             const hashtags = post.content.match(/#(\w+)/g);

              if(hashtags){
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
                        'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                        [insertedPost.id, insertedHashtag.id, post.user_id]
                      )
                    }
                    else{
                      await t.none(
                        'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                          [insertedPost.id, existingHashtag.id, post.user_id]
                      )
                    }
                  }
                  catch(error){
                    if (error.code !== '23505') {
                      throw error;
                    }
                  }
                }
              }
            return insertedPost
          }
          
           else{
            const insertedPost = await t.one(
              'INSERT INTO replies (posts_id, user_id, content, posts_img, gif, url, url_img, url_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
              [post.posts_id , post.user_id, post.content, post.posts_img, post.gif, null , null , null]
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
                  await t.one(
                    'INSERT INTO notifications (users_id, reply_id, is_read, sender_id, selected) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [user.id, insertedPost.id, false, post.user_id, false]
                  );
                  
                  if(user.notifications){
                    await sendEmail(user.email, user.firstname);
                  }
                  
                }
              }
            }
            const hashtags = post.content.match(/#(\w+)/g);

              if(hashtags){
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
                        'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                        [insertedPost.id, insertedHashtag.id, post.user_id]
                      )
                    }
                    else{
                      await t.none(
                        'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                          [insertedPost.id, existingHashtag.id, post.user_id]
                      )
                    }
                  }
                  catch(error){
                    if (error.code !== '23505') {
                      throw error;
                    }
                  }
                }
              }
          }
              });
    
        return addPost;
      } catch (error) {
        console.log(error);
        return error;
      }
};



const createReactionR = async (react, creatorId, userId, replyId) => {
  try {
    const existing = await db.oneOrNone(
      `SELECT reaction_type FROM reply_reactions
      WHERE user_id = $1 AND reply_id = $2`,
      [userId, replyId]
    );

    if (existing) {
      // Delete the reaction
      await db.none(
        `DELETE FROM reply_reactions WHERE user_id = $1 AND reply_id = $2`,
        [userId, replyId]
      );
    } else {
      // Insert a new reaction
      await db.none(
        `INSERT INTO reply_reactions (user_id, reply_id, reaction_type, creator_id)
         VALUES ($1, $2, $3, $4)`,
        [userId, replyId, react, creatorId]
      );
    }
    console.log(existing)
    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
};



const getReaction = async (id) => {
  try {
   const reactions = await db.any(
     'SELECT user_id, creator_id, reaction_type FROM reply_reactions WHERE reply_id = $1',
     [id]
   )

   const likes = reactions.filter((reaction) => reaction.reaction_type === "like")
   const dislikes = reactions.filter((reaction) => reaction.reaction_type === "dislike")

   const likeId = likes.map((like) => like.user_id)
   const dislikeId = dislikes.map((dislike) => dislike.user_id)

   const creatorId = reactions.length > 0 ? reactions[0].creator_id : null;

   const result = {
    likes: likes.length,
    dislikes: dislikes.length,
    likeId,
    dislikeId,
    reply_id: id,
    creator_id: creatorId
  };
   return result 


  } catch (error) {
    console.log(error);
    return error;
  }
};



module.exports = { createReply, getReplies, createReactionR, getReaction}