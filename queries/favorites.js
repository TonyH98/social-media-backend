
const db = require("../db/dbConfig")


const getAllFavorites = async (userId) => {
    try {
        const favoritesByUser = await db.any(
            `SELECT fp.favorites, fp.selected, fp.posts_id, fp.users_id,
            json_build_object(
                'creator_id', fp.creator_id,
                'content', p.content,
                'image', p.posts_img,
                'date_created', to_char(p.date_created, 'MM/DD/YYYY'),
                'profile_img', u.profile_img,
                'username', u.username,
                'profile_name', u.profile_name
            ) AS post_creator
            FROM favorite_posts fp
            JOIN users u ON u.id = fp.creator_id
            JOIN posts p ON p.id = fp.posts_id
            JOIN users f ON f.id = fp.users_id
            WHERE fp.users_id = $1`,
            userId
        );
        return favoritesByUser;
    } catch (error) {
        console.log(error);
        return error;
    }
};

const getFavorites = async (userId, postId) => {
    try {
        const favoritesByUser = await db.one(
            `SELECT fp.favorites, fp.selected, fp.posts_id, fp.users_id,
            json_build_object(
                'creator_id', fp.creator_id,
                'content', p.content,
                'image', p.posts_img,
                'date_created', to_char(p.date_created, 'MM/DD/YYYY'),
                'profile_img', u.profile_img,
                'username', u.username,
                'profile_name', u.profile_name
            ) AS post_creator
            FROM favorite_posts fp
            JOIN users u ON u.id = fp.creator_id
            JOIN posts p ON p.id = fp.posts_id
            JOIN users f ON f.id = fp.users_id
            WHERE fp.users_id = $1 AND fp.posts_id = $2`,
            [userId , postId]
        );
        return favoritesByUser;
    } catch (error) {
        console.log(error);
        return []
    }
};


const addFavorites = async (userId, postId, fav) => {

try{
    const addFav = await db.one(
        `INSERT INTO favorite_posts (users_id, posts_id, creator_id, favorites, selected) VALUES ($1, $2, $3, $4, $5)`,
        [userId, postId, fav.creator_id, true, false]
    )
    console.log(addFav)
    return addFav
}
catch(error){
    console.log(error)
    return error
}

}

const deleteFavorite = async (userId , postId) => {
    try{
       const deleteFav = await db.one(
    `DELETE FROM favorite_posts WHERE favorite_posts.users_id = $1 AND favorite_posts.posts_id = $2`,
    [userId , postId]
       )
       return deleteFav
    }
    catch(error){
        console.log(error)
        return error
    }
}





const getAllFavoritesReplies = async (userId) => {
    try {
        const favoritesByUser = await db.any(
            `SELECT fr.favorites, fr.selected, fr.posts_id, fr.users_id,
            json_build_object(
                'creator_id', fr.creator_id,
                'content', r.content,
                'image', r.posts_img,
                'date_created', to_char(r.date_created, 'MM/DD/YYYY'),
                'profile_img', u.profile_img,
                'username', u.username,
                'profile_name', u.profile_name
            ) AS post_creator
            FROM favorite_replies fr
            JOIN users u ON u.id = fr.creator_id
            JOIN replies r ON r.id = fr.reply_id
            JOIN users f ON f.id = fr.users_id
            WHERE fp.users_id = $1`,
            userId
        );
        return favoritesByUser;
    } catch (error) {
        console.log(error);
        return error;
    }
};


const addFavoritesReplies = async (userId, replyId, fav) => {

    try{
        const addFav = await db.one(
            `INSERT INTO favorite_replies (users_id, reply_id, creator_id, favorites, selected) VALUES ($1, $2, $3, $4, $5)`,
            [userId, replyId, fav.creator_id, true, false]
        )
        return addFav
    }
    catch(error){
        console.log(error)
        return error
    }
    
    }

    const deleteFavoriteReplies = async (userId , replyId) => {
        try{
           const deleteFav = await db.one(
        `DELETE FROM favorite_replies WHERE favorite_replies.users_id = $1 AND favorite_replies.reply_id = $2`,
        [userId , replyId]
           )
           return deleteFav
        }
        catch(error){
            console.log(error)
            return error
        }
    }

module.exports={getAllFavorites , getFavorites, deleteFavorite, addFavorites , getAllFavoritesReplies , addFavoritesReplies , deleteFavoriteReplies}