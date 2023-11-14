
const db = require("../db/dbConfig")


const getAllFavoritesPosts = async (userId) => {
    try {
        const favoritesByUser = await db.any(

            `SELECT fp.posts_id AS id, fp.selected, p.content, p.gif, p.posts_img, p.user_name,
            p.repost_counter, to_char(p.date_created, 'MM/DD/YYYY') AS time,
            json_build_object(
                'id', fp.creator_id,
                'username', u.username,
                'profile_img', u.profile_img,
                'profile_name', u.profile_name
            ) AS creator FROM favorite fp
             JOIN users u ON u.id = fp.creator_id
            JOIN posts p ON p.id = fp.posts_id
             JOIN users f ON f.id = fp.users_id
             WHERE fp.users_id = $1
            `, userId
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
            FROM favorite fp
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
        `INSERT INTO favorite (users_id, posts_id, creator_id, favorites, selected) VALUES ($1, $2, $3, $4, $5)`,
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
    `DELETE FROM favorite WHERE favorite.users_id = $1 AND favorite.posts_id = $2`,
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
            `SELECT fr.favorites, fr.selected, fr.reply_id, fr.users_id,
            json_build_object(
                'creator_id', fr.creator_id,
                'content', r.content,
                'image', r.posts_img,
                'date_created', to_char(r.date_created, 'MM/DD/YYYY'),
                'profile_img', u.profile_img,
                'username', u.username,
                'profile_name', u.profile_name,
                'gif', r.gif
            ) AS post_creator
            FROM favorite fr
            JOIN users u ON u.id = fr.creator_id
            JOIN replies r ON r.id = fr.reply_id
            JOIN users f ON f.id = fr.users_id
            WHERE fr.users_id = $1`,
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
            `INSERT INTO favorite (users_id, reply_id, creator_id, favorites, selected) VALUES ($1, $2, $3, $4, $5)`,
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
        `DELETE FROM favorite WHERE favorite.users_id = $1 AND favorite.reply_id = $2`,
        [userId , replyId]
           )
           return deleteFav
        }
        catch(error){
            console.log(error)
            return error
        }
    }


    const getAllFavorites = async (user_id) => {
        
        try{

            const getAllFav = await db.any(
                `SELECT posts_id, reply_id FROM favorite WHERE favorite.users_id = $1`, 
                [user_id]
                )
                
            let favArr = {}

            for(let fav of getAllFav){
                if(fav.posts_id){
                    const allFav = await db.any(

                        `SELECT fp.id AS fav_id, fp.posts_id AS id, 
                        fp.selected, p.content, p.gif, p.posts_img, p.url, p.url_title, p.url_img, p.user_name,
                        p.repost_counter, to_char(p.date_created, 'MM/DD/YYYY') AS time, 
                        fp.posts_id, fp.reply_id,
                        json_build_object(
                            'id', fp.creator_id,
                            'username', u.username,
                            'profile_img', u.profile_img,
                            'profile_name', u.profile_name
                        ) AS creator FROM favorite fp
                         JOIN users u ON u.id = fp.creator_id
                        JOIN posts p ON p.id = fp.posts_id
                         JOIN users f ON f.id = fp.users_id
                         WHERE fp.users_id = $1
                        `, user_id
                    );
                    for(let fav of allFav){
                        if(!favArr[fav.fav_id]){
                            favArr[fav.fav_id] = fav
                        }
                    }
                }
                else{
                    const allFav = await db.any(
                        `SELECT fr.id AS fav_id, fr.reply_id AS id, fr.users_id,
                         r.content, r.url, r.url_title, r.url_img, fr.posts_id, fr.reply_id,
                        r.posts_img, r.gif, to_char(r.date_created, 'MM/DD/YYYY') AS time, r.posts_id AS origin_id,
                        json_build_object(
                            'id', fr.creator_id,
                            'profile_img', u.profile_img,
                            'username', u.username,
                            'profile_name', u.profile_name
                        ) AS creator
                        FROM favorite fr
                        JOIN users u ON u.id = fr.creator_id
                        JOIN replies r ON r.id = fr.reply_id
                        JOIN users f ON f.id = fr.users_id
                        WHERE fr.users_id = $1`,
                        user_id
                    );
                    for(let fav of allFav){
                        if(!favArr[fav.fav_id]){
                            favArr[fav.fav_id] = fav
                        }
                    }
                }
            }
            return Object.values(favArr)

        }
        catch(error){
            console.log(error)
            return error
        }

    }


module.exports={getAllFavoritesPosts, 
    getFavorites, 
    deleteFavorite, 
    addFavorites, 
    getAllFavoritesReplies, 
    addFavoritesReplies, 
    deleteFavoriteReplies,
    getAllFavorites}