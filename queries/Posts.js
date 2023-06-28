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
            `UPDATE posts SET likes = $1, dislikes = $2, views = $3 WHERE id=$4 `,
            [post.likes, post.dislikes, post.views, id]
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

module.exports = {getAllPosts, createPost, updatePost, deletePosts}