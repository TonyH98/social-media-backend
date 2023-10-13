const db = require("../db/dbConfig")
const nodemailer = require('nodemailer')

const password = process.env.Email_Password

const getReplies = async (postId) => {
    try{
        const allReplies = await db.any(
            `SELECT r.id, r.posts_id, r.content, to_char(r.date_created, 'MM/DD/YYYY') AS time, r.posts_img,
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
    
    
            const embeddedImage = `<a href="${articleUrl}" target="_blank"><img src="${articleImage}" alt="${articleTitle}" width="400" height="300" /></a>`;
    
    
            const postContentWithoutUrl = post.content.replace(articleUrl, '');
            
         
            const postContent = `${postContentWithoutUrl}\n${embeddedImage}\n
            ${articleTitle}\n\nCompany: ${companyName}`;

            const insertedPost = await t.one(
              'INSERT INTO replies (posts_id, user_id, content, posts_img) VALUES ($1, $2, $3, $4) RETURNING *',
              [post.posts_id , post.user_id, postContent, post.posts_img]
            );
            const hashtags = post.content.match(/#(\w+)/g);
            if(hashtags){
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
              return insertedPost
            }
          }
          
           else{
            const insertedPost = await t.one(
              'INSERT INTO replies (posts_id, user_id, content, posts_img) VALUES ($1, $2, $3, $4) RETURNING *',
              [post.posts_id , post.user_id, post.content, post.posts_img]
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
                  
                    await sendEmail(user.email, user.firstname);
                  
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


const createReactionR = async (react, userId, replyId) => {
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
        `INSERT INTO reply_reactions (user_id, reply_id, reaction_type)
         VALUES ($1, $2, $3)`,
        [userId, replyId, react]
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
    const reaction = await db.one(
      `SELECT
        COALESCE(SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes
        FROM reply_reactions
        WHERE reply_id = $1;`,
      [id]
    );

    // Create a result object that includes the likes, dislikes, and post_id
    const result = {
      likes: reaction.likes,
      dislikes: reaction.dislikes,
      reply_id: id,
    };

    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};






module.exports = {deleteReply , createReply, getReplies, createReactionR, getReaction}