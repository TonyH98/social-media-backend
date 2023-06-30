const db = require("../db/dbConfig")

const getAllPosts = async (user_name) => {
    try {
        const allPosts = await db.any(
            `SELECT posts.id, posts.content, to_char(date_created, 'MM/DD/YYYY') AS time,
            json_build_object(
                'id', users.id,
                'username', posts.user_name,
                'firstname', users.firstname,
                'lastname', users.lastname,
                'profile_name', users.profile_name,
                'profile_img', users.profile_img
            ) AS creator, posts.likes, posts.user_id, posts.dislikes, posts.views
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



const createPost = async (post) => {
    try {
        const addPost = await db.one(
            'INSERT INTO posts (user_name, content, likes, dislikes, views, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [post.user_name, post.content, 0, 0, 0, post.user_id]
        );
        const metionedUsers = post.content.match(/@(\w+)/g)

        if(metionedUsers){
            for(const mention of metionedUsers){
                const username = mention.substring(1)

                const user = await db.oneOrNone(`SELECT id FROM users WHERE username = $1`, username)

                if(user){
                    await db.none('INSERT INTO notifications (users_id, posts_id, is_read, sender_id) VALUES ($1, $2, $3, $4, $5)', [user.id, addPost.id, false, addPost.user_id, false])
                }
            }
        }

        return addPost;
    } catch (error) {
        return error;
    }
};

const updatePost = async (post , id) => {
    try{
        const updatePost = await db.one(
            `UPDATE posts SET views = $1 WHERE id=$2 `,
            [post.views, id]
        )
        return updatePost
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

  const deleteReaction = async 
  

module.exports = {getAllPosts, createPost, updatePost, deletePosts, createReaction, getReaction}