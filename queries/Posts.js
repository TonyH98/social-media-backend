const db = require("../db/dbConfig")

const nodemailer = require('nodemailer')

const password = process.env.Email_Password

const cheerio = require('cheerio')
const axios = require('axios')


const getAllPosts = async (user_name) => {
    try {
        const allPosts = await db.any(
            `SELECT posts.id, posts.content, posts.posts_img, to_char(posts.date_created, 'MM/DD/YYYY') AS time,
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
            WHERE posts.user_name = $1`,
            user_name
        );
        return allPosts;
    } catch (error) {
        console.log(error);
        return error;
    }
};

const getPost = async (user_name, id) => {
  try {
      const allPosts = await db.one(
          `SELECT posts.id, posts.content, posts.posts_img, to_char(posts.date_created, 'MM/DD/YYYY') AS time,
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
          'INSERT INTO posts (user_name, content, user_id, posts_img) VALUES ($1, $2, $3, $4) RETURNING *',
          [post.user_name, postContent, post.user_id, post.posts_img]
        );

        
        const hashtags = post.content.match(/#(\w+)/g);
        if (hashtags) {
          for (const hash of hashtags) {
            try {
              const insertedHashtag = await t.one(
                'INSERT INTO hashtags (tag_names) VALUES ($1) ON CONFLICT (tag_names) DO UPDATE SET tag_names = $1 RETURNING id',
                hash
              );
  
              await t.none(
                'INSERT INTO post_hashtags (post_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                [insertedPost.id, insertedHashtag.id, post.user_id]
              );
            } catch (error) {
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
          'INSERT INTO posts (user_name, content, user_id, posts_img) VALUES ($1, $2, $3, $4) RETURNING *',
          [post.user_name, post.content, post.user_id, post.posts_img]
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
             
                await sendEmail(user.email, user.firstname);
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
                'INSERT INTO post_hashtags (post_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
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

      }
    });

    return addPost;
  } catch (error) {
    console.log(error);
    return error;
  }
};



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

const createReaction = async (react , userId, postId) => {
    try {
      const existing = await db.oneOrNone(
        `SELECT reaction_type FROM post_reactions
        WHERE user_id =$1 and post_id = $2`,
        [react, userId , postId]
      )

      if(existing){
        if(existing.reaction_type === react.reaction_type){
            await db.none(
                `DELETE FROM post_reactions WHERE user_id =$1 AND post_id =$2`,
                [userId , postId]
            )
        }
        else{
            await db.none(
                `UPDATE post_reactions SET reaction_type = $1 WHERE user_id = $2 AND post_id = $3`,
                [react, userId , postId]
            )
        }
      }
      else{
        await db.none(
            `INSERT INTO post_reactions (user_id, post_id, reaction_type)
             VALUES ($1, $2, $3)`,
            [react, userId , postId]
          );
      }
      return true
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  
  const getReaction = async (id) => {
    try {
      const getReactions = db.one(
        `SELECT
        COALESCE(SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes
        FROM post_reactions
         WHERE post_id = $1 ;`,
        id
      );
      return getReactions;
    } catch (error) {
      console.log(error);
      return error;
    }
  };


module.exports = {getAllPosts, getPost, createPost, deletePosts, createReaction, getReaction}