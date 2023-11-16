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


  const getAllFollowPosts = async(userId) => {
    try{
      const getFollowersPost = await db.any(
          `SELECT uf.follow, uf.selected, uf.user_id, p.content, 
          p.gif, p.posts_img, p.url, p.url_title, p.url_img, p.id,
          to_char(p.date_created, 'MM/DD/YYYY') AS time, p.repost_counter,
          json_build_object(
            'id', uf.following_id,
            'username', f.username,
            'profile_name', f.profile_name,
            'profile_img', f.profile_img
          ) As creator
          FROM users_followers uf
          JOIN users u ON u.id = uf.user_id
          JOIN users f ON f.id = uf.following_id
          JOIN posts p ON p.user_id = uf.following_id
          WHERE uf.user_id = $1`,
          userId
      )
      return getFollowersPost
  }
  catch(error){
      console.log(error)
      return error
  }
  }

  const getAllFollowReplies = async(userId) => {
    try{
      const getFollowersPost = await db.any(
          `SELECT uf.follow, uf.selected, uf.user_id, r.content, 
          r.gif, r.posts_img, r.url, r.url_title, r.url_img, r.id,
          to_char(r.date_created, 'MM/DD/YYYY') AS time, r.posts_id,
          json_build_object(
            'id', uf.following_id,
            'username', f.username,
            'profile_name', f.profile_name,
            'profile_img', f.profile_img
          ) As creator
          FROM users_followers uf
          JOIN users u ON u.id = uf.user_id
          JOIN users f ON f.id = uf.following_id
          JOIN replies r ON r.user_id = uf.following_id
          WHERE uf.user_id = $1`,
          userId
      )
      return getFollowersPost
  }
  catch(error){
      console.log(error)
      return error
  }
  }
  

  const getAllFollowers = async (userId) => {
      try{
        const getFollowers = await db.any(
          `SELECT u.username, u.profile_img, u.bio, u.profile_name, u.id
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



  module.exports={getAllFollowing,
    addFollowingToUser, 
    deletePersonFromUsers, 
    getAllFollowers,
    getAllFollowPosts,
    getAllFollowReplies}