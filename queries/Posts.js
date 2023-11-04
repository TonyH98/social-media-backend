const db = require("../db/dbConfig")

const nodemailer = require('nodemailer')

const password = process.env.Email_Password

const cheerio = require('cheerio')
const axios = require('axios')


const getAllPosts = async (user_name) => {
  try {
      const checkRepost = await db.any(
          `SELECT repost FROM posts WHERE posts.user_name = $1`, [user_name]
      );

      let allPosts = [];

      for (let check of checkRepost) {

          if (check.repost === false) {
              const posts = await db.any(
                  `SELECT posts.id, posts.content, posts.posts_img, posts.gif, posts.repost, posts.repost_id, to_char(posts.date_created, 'MM/DD/YYYY') AS time,
                  json_build_object(
                      'id', users.id,
                      'username', posts.user_name,
                      'firstname', users.firstname,
                      'lastname', users.lastname,
                      'profile_name', users.profile_name,
                      'profile_img', users.profile_img
                  ) AS creator, posts.user_id
                  FROM posts
                  JOIN users ON posts.user_name = users.username
                  WHERE posts.user_name = $1
                  ORDER BY posts.date_created ASC`,
                  [user_name]
              );
              allPosts = allPosts.concat(posts);
          } else {
            console.log(check)
            const posts = await db.any(
              `SELECT p.id, p.user_name, p.repost, 
              json_build_object(
                  'creator_id', p.user_id,
                  'profile_img', u.profile_img,
                  'username', u.username,
                  'profile_name', u.profile_name
              ) AS original_creator, 
              json_build_object(
                  'content', o.content,
                  'posts_img', o.posts_img,
                  'gif', o.gif,
                  'repost_id', p.repost_id
              ) AS original_content 
              FROM posts p
              JOIN users u ON u.id = p.user_id
              JOIN posts o ON p.repost_id = o.id 
              WHERE p.user_name = $1;`,
              [user_name]
          );
              allPosts = allPosts.concat(posts);
          }
      }
      return allPosts;
  } catch (error) {
      console.error(error);
      return error;
  }
};




const getPost = async (user_name, id) => {
  try {
      const allPosts = await db.one(
          `SELECT posts.id, posts.content, posts.posts_img, posts.gif, to_char(posts.date_created, 'MM/DD/YYYY') AS time,
          json_build_object(
              'id', users.id,
              'username', posts.user_name,
              'firstname', users.firstname,
              'lastname', users.lastname,
              'profile_name', users.profile_name,
              'profile_img', users.profile_img
          ) AS creator, posts.user_id
          FROM posts
          JOIN users ON posts.user_name = users.username
          WHERE posts.user_name = $1 AND posts.id = $2`,
          [user_name, id]
      );
      return allPosts;
  } catch (error) {
      console.log(error);
      return error;
  }
};

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

const createPost = async (post) => {
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
          'INSERT INTO posts (user_name, content, user_id, posts_img, gif, repost, repost_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [post.user_name, postContent, post.user_id, post.posts_img, post.gif, false, null]
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
                'INSERT INTO notifications (users_id, posts_id, is_read, sender_id, selected) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [user.id, insertedPost.id, false, post.user_id, false]
              );
             if(user.notifications){
               await sendEmail(user.email, user.firstname);
             }
            }
          }
        }


        const hashtags = post.content.match(/#(\w+)/g);
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
                  'INSERT INTO post_hashtags (post_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                  [insertedPost.id, insertedHashtag.id, post.user_id]
                )
              }
              else{
                await t.none(
                  'INSERT INTO post_hashtags (post_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                  [insertedPost.id, existingHashtag.id, post.user_id]
                );
              }
            }
            catch(error){
              if (error.code !== '23505') {
                throw error;
              }
            }
          }
        }
        return insertedPost;

      }


  
      else{
        const insertedPost = await t.one(
          'INSERT INTO posts (user_name, content, user_id, posts_img, gif, repost, repost_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [post.user_name, post.content, post.user_id, post.posts_img, post.gif, false, null]
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
                'INSERT INTO notifications (users_id, posts_id, is_read, sender_id, selected) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [user.id, insertedPost.id, false, post.user_id, false]
              );
             if(user.notifications){
               await sendEmail(user.email, user.firstname);
             }
            }
          }
        }
  
        const hashtags = post.content.match(/#(\w+)/g);
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
                  'INSERT INTO post_hashtags (post_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                  [insertedPost.id, insertedHashtag.id, post.user_id]
                )
              }
              else{
                await t.none(
                  'INSERT INTO post_hashtags (post_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                  [insertedPost.id, existingHashtag.id, post.user_id]
                );
              }
            }
            catch(error){
              if (error.code !== '23505') {
                throw error;
              }
            }
          }
        }
  
      
    
        return insertedPost;

      }
    });

    return addPost;
  } catch (error) {
    console.log(error);
    return error;
  }
};



const createRepost = async (username , postId, post) => {

try{
  const addRepost = await db.one(
    `INSERT INTO posts (user_name, repost_id, user_id, repost) VALUES ($1, $2, $3, $4)`,
    [username , postId, post.user_id, true]
  )
  return addRepost
}
catch(error){
  console.log(error)
  return error
}


}


const deletePosts = async (id) => {
    try{
        const deletePost = await db.one(
            'DELETE FROM posts WHERE id = $1 RETURNING *', id
        )
        return deletePost
    }
    catch(error){
        return error
    }
}

const createReaction = async (react, userId, postId) => {
  try {
    const existing = await db.oneOrNone(
      `SELECT reaction_type FROM post_reactions
      WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );

    if (existing) {
      // Delete the reaction
      await db.none(
        `DELETE FROM post_reactions WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );
    } else {
      // Insert a new reaction
      await db.none(
        `INSERT INTO post_reactions (user_id, post_id, reaction_type)
         VALUES ($1, $2, $3)`,
        [userId, postId, react]
      );
    }
    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
};


const getReaction = async (id) => {
  try {
   const reactions = await db.any(
     'SELECT user_id, reaction_type FROM post_reactions WHERE post_id = $1',
     [id]
   )

   const likes = reactions.filter((reaction) => reaction.reaction_type === "like")
   const dislikes = reactions.filter((reaction) => reaction.reaction_type === "dislike")

   const likeId = likes.map((like) => like.user_id)
   const dislikeId = dislikes.map((dislike) => dislike.user_id)

   const result = {
    likes: likes.length,
    dislikes: dislikes.length,
    likeId,
    dislikeId,
    post_id: id
  };
   return result 


  } catch (error) {
    console.log(error);
    return error;
  }
};

  

const getAllUsersReplies = async (userId) => {
  try{
      const allReplies = await db.any(
          `SELECT r.id, r.posts_id, r.content, r.gif, to_char(r.date_created, 'MM/DD/YYYY') AS time, r.posts_img,
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
      WHERE r.user_id = $1
      GROUP BY r.id, r.posts_id, users.username, users.firstname, users.lastname, users.profile_name, users.profile_img;`,
     userId

      );
      return allReplies
  }
  catch(error){
      console.log(error)
      return error
  }
}
module.exports = {getAllPosts, getPost, createPost, deletePosts, createReaction, getReaction, getAllUsersReplies, createRepost}