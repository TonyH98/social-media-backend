const db = require("../db/dbConfig")



const getAllFollowing = async (userId) => {
    try{
        const getFollowers = await db.any(
            `SELECT uf.follow, uf.selected, uf.added, uf.user_id, uf.following_id,
            f.username, f.profile_img, f.bio, f.profile_name
            FROM users_followers uf
            JOIN users u ON u.id = uf.user_id
            JOIN users f ON f.id = uf.following_id
            WHERE uf.user_id = $1`,
            userId
        )
        return getFollowers
    }
    catch(error){
        console.log(error)
        return error
    }
  }
  const getAllFollowers = async (userId) => {
      try{
        const getFollowers = await db.any(
          `SELECT u.username, u.profile_img, u.bio 
          FROM users_followers uf
          JOIN users f ON f.id = uf.following_id
          JOIN users u ON u.id = uf.user_id
          WHERE uf.following_id = $1`,
          userId
      );
      
          return getFollowers
      }
      catch(error){
          console.log(error)
          return error
      }
  }

const addFollowingToUser = async (userId, followId) => {
    try {
      const add = await db.none(
        `INSERT INTO users_followers (user_id, following_id, selected, added) VALUES($1, $2, $3, $4)`,
        [userId, followId, false , true]
      );
      return !add;
    } catch (error) {
      return error;
    }
  };

  const deletePersonFromUsers = async (userId, followingId) => {
    try {
      const deleteUser = await db.one(
        "DELETE FROM users_Followers WHERE user_id = $1 AND following_id = $2 RETURNING *",
        [userId, followingId]
      );
      return deleteUser;
    } catch (error) {
      return error;
    }
  };



  module.exports={getAllFollowing, addFollowingToUser, deletePersonFromUsers, getAllFollowers}