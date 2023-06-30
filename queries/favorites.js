const db = require("../db/dbConfig")


const getAllFavorites = async (userId) => {
    try {
        const favoritesByUser = await db.any(
            `SELECT fp.favorites, fp.selected, fp.posts_id, fp.users_id,
            json_build_object(
                'creator_id', fp.creator_id,
                'content', p.content,
                'p.date_created', p.date_created,
                'views', p.views,
                'profile_img', u.profile_img,
                'username', u.username,
                'profile_name', u.profile_name
            ) AS post_creator
            FROM favorite_posts fp
            JOIN users u ON u.id = fp.creator_id
            JOIN posts p ON p.id = fp.posts_id
            JOIN users f ON f.id = fp.users_id
            WHERE fp.users_id = $1`,
            [userId]
        );
        return favoritesByUser;
    } catch (error) {
        console.log(error);
        return error;
    }
};


const addFavorites = async (userId, postId, fav) => {

try{
    const addFav = await db.one(
        `INSERT INTO favorite_posts (users_id, posts_id, creator_id, favorites, selected) VALUES ($1, $2, $3, $4, $5)`,
        [userId, postId, fav.creator_id, true, false]
    )
    return addFav
}
catch(error){
    console.log(error)
    return error
}

}

const deleteFavorite = async (userId , postId) => {
    try{
        `DELETE * FROM favorite_posts WHERE favorite_posts.user_id = $1 AND favorite_posts.posts_id = $2`,
        [userId , postId]
    }
    catch(error){
        console.log(error)
        return error
    }
}


module.exports={getAllFavorites , deleteFavorite, addFavorites}