const db = require("../db/dbConfig")

const getReplies = async (postId) => {
    try{
        const allReplies = await db.any(
            `SELECT r.id, r.posts_id, r.content, to_char(date_created, 'MM/DD/YYYY') AS time,
            json_build_object(
                'id', r.user_id,
                'username', users.username,
                'firstname', users.firstname,
                'lastname', users.lastname,
                'profile_name', users.profile_name,
                'profile_img', users.profile_img
            ) As creator
            FROM replies r 
            JOIN users ON users.id = r.user_id
            WHERE replies.posts_id = $1
            GROUP BY r.posts_id
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
      pass: 'mkikxfvggubdtdze'
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
        const addPost = await db.one(
            'INSERT INTO replies (posts_id, content, user_id) VALUES ($1, $2, $3) RETURNING *',
            [post.posts_id, post.content, 0, post.user_id]
        );
        const metionedUsers = post.content.match(/@(\w+)/g)

        if(metionedUsers){
            for(const mention of metionedUsers){
                const username = mention.substring(1)

                const user = await db.oneOrNone(`SELECT id FROM users WHERE username = $1`, username)

                if(user){
                    await db.none('INSERT INTO notifications (users_id, reply_id, is_read, sender_id, selected) VALUES ($1, $2, $3, $4, $5)', [user.id, addPost.id, false, addPost.user_id, false])
                    await sendEmail(user.email, user.firstname);
                }
            }
        }

        return addPost;
    } catch (error) {
        console.log(error)
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