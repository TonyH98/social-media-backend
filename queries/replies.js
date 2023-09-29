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
              'INSERT INTO replies (posts_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
              [post.posts_id , post.user_id, postContent]
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
                      await t.one(
                        'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                        [insertedPost.id, insertedHashtag.id, post.user_id]
                      )
                    }
                    else{
                      'INSERT INTO post_hashtags (reply_id, hashtag_id, user_id) VALUES ($1, $2, $3)',
                        [insertedPost.id, insertedHashtag.id, post.user_id]
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

module.exports = {deleteReply , createReply, getReplies}