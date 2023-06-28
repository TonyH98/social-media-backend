const db = require("../db/dbConfig")


const getAllFavorites = async (userId , postId) => {
    try{
        const favoritesByUser = await db.any(
            `SELECT fp.favorites, fp.selected, fp.posts_id, fp.creator_id, fp.users_id, p.content, p.date_created, p.likes, p.dislikes, p.views
            json_build_object(
                'profile_img', users.profile_img,
                'username', users.username,
                'profile_name', users.profile_name
            ) AS post_creator
            FROM favorite_posts fp
            JOIN users u ON u.id = fp.users_id
            JOIN posts p ON p.id = fp.posts_id
            JOIN u ON u.id = fp.creator.id
            WHERE fp.users_id AND fp.posts_id = $2`,
            [userId , postId]
        )
        return favoritesByUser
    }
    catch (error) {
        console.log(error);
        return error;
      }

}