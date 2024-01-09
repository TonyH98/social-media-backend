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

    let allPosts = {};
    
    for (let check of checkRepost) {

      if (check.repost === false) {
        const posts = await db.any(
          `SELECT  posts.id, posts.repost_counter, posts.pin, posts.content, posts.posts_img, posts.user_name, 
          posts.gif, posts.repost, posts.repost_id, to_char(posts.date_created, 'MM/DD/YYYY') AS time, posts.url_img,
          posts.url_title, posts.url,
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
          ORDER BY posts.pin DESC, posts.date_created DESC`,
          [user_name]
        );

        for (let post of posts) {
          if (!(post.content === null || post.content === '') || !(post.posts_img === null || post.posts_img === '') || !(post.gif === null || post.gif === '')) {
            if (!allPosts[post.id]) {
              allPosts[post.id] = post;
            }
          }
        }
      } else {

        const posts = await db.any(
          `SELECT p.id AS post_id, o.repost_counter, o.content, p.user_name, 
          o.posts_img, o.gif, p.repost, p.repost_id AS id, 
          to_char(o.date_created, 'MM/DD/YYYY') AS time, o.url_img,
          o.url_title, o.url,
          json_build_object(
              'id', u.id,
              'username', u.username,
              'firstname', u.firstname,
              'lastname', u.lastname,
              'profile_name', u.profile_name,
              'profile_img', u.profile_img,
              'repost_id', p.repost_id
          ) AS creator, 
          p.user_id
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN posts o ON p.repost_id = o.id 
      WHERE p.user_name = $1`,
      [user_name]
      );

        for (let post of posts) {
          if (!(post.content === null || post.content === '') || !(post.posts_img === null || post.posts_img === '') || !(post.gif === null || post.gif === '')) {
            if (!allPosts[post.post_id]) {
              allPosts[post.post_id] = post;
            }
          }
        }
      }
    }

    return Object.values(allPosts);
  } catch (error) {
    console.error(error);
    return error;
  }
};






const getPost = async (user_name, id) => {
  try {
      const allPosts = await db.one(
          `SELECT posts.id, posts.content, posts.posts_img, posts.gif, posts.repost_counter,
           to_char(posts.date_created, 'MM/DD/YYYY') AS time, posts.url_img, posts.pin,
           posts.url_title, posts.url,
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

        
        const postContentWithoutUrl = post.content.replace(articleUrl, '');
        
     
        const postContent = `${postContentWithoutUrl}`;
        

        const insertedPost = await t.one(
          `INSERT INTO posts
           (user_name, content, user_id, posts_img, gif, repost, repost_id, repost_counter, pin, url, url_img, url_title)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [post.user_name, postContent, post.user_id, post.posts_img, post.gif, false, null, 0, false, articleUrl, articleImage, articleTitle]
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
          return insertedPost;
        }

      }


  
      else{
        const insertedPost = await t.one(
          `INSERT INTO posts
           (user_name, content, user_id, posts_img, gif, repost, repost_id, repost_counter, pin, url, url_img, url_title)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [post.user_name, post.content, post.user_id, post.posts_img, post.gif, false, null, 0, false, null, null, null]
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


let executing = false 

const createRepost = async (username , postId, post) => {

try{
  if(!executing ){
    executing = true
    const addRepost = await db.one(
      `INSERT INTO posts (user_name, repost_id, user_id, repost) VALUES ($1, $2, $3, $4)`,
      [username , postId, post.user_id, true]
    )
    executing = false
    return addRepost
  }
  else{
    return "Alreadyy executing..."
  }
}
catch(error){
  console.log(error)
  executing = false
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

const createReaction = async (react, creatorId, userId, postId) => {
  try {
    const existing = await db.oneOrNone(
      `SELECT reaction_type FROM post_reactions
      WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    console.log(existing)
    if (existing) {
      await db.none(
        `DELETE FROM post_reactions WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );
    } else {
      await db.none(
        `INSERT INTO post_reactions (user_id, post_id, reaction_type, creator_id)
         VALUES ($1, $2, $3, $4)`,
        [userId, postId, react, creatorId]
      );
    }
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};



const getReaction = async (id) => {
  try {
   const reactions = await db.any(
     'SELECT user_id, creator_id, reaction_type FROM post_reactions WHERE post_id = $1',
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
    post_id: id,
    creator_id: creatorId
  };
   return result 


  } catch (error) {
    console.log(error);
    return error;
  }
};

const editPosts = async (id, post) => {
  try {
    const getUsersPost = await db.oneOrNone(
      'SELECT id FROM posts WHERE pin = $1 AND user_name = $2',
      [true, post.username]
    );

    if (getUsersPost) {
      await db.one(
        'UPDATE posts SET pin=$1 WHERE id=$2 RETURNING *',
        [false, getUsersPost.id]
      );
    }
    const edit = await db.one(
      'UPDATE posts SET repost_counter=$1, pin=$2 WHERE id=$3 RETURNING *',
      [post.repost_counter, post.pin, id]
    );

    return edit;
  } catch (error) {
    console.log(error);
    return error;
  }
};



const getAllUsersReplies = async (userId) => {
  try{
      const allReplies = await db.any(
          `SELECT r.id, r.posts_id, r.content, r.gif, to_char(r.date_created, 'MM/DD/YYYY') AS time, r.posts_img, r.url, r.url_title, r.url_img,
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
module.exports = {getAllPosts, 
  getPost, 
  createPost, 
  deletePosts,
   createReaction,
    getReaction, 
    getAllUsersReplies, 
    createRepost, 
    editPosts}