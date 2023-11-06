const db = require("../db/dbConfig")

const searchPost = async (tagName) => {
  try {
    const search = await db.any(

      `SELECT ph.post_id AS id, ph.user_id, ph.reply_id, ph.hashtag_id, p.user_name, p.content, p.posts_img, p.gif, h.tag_names,
      to_char(p.date_created, 'MM/DD/YYYY') AS time, 
      json_build_object(
           'username', p.user_name,
           'profile_name', u.profile_name,
           'profile_img', u.profile_img,
           'id', u.id
      ) AS creator
      FROM post_hashtags ph
       JOIN posts p ON p.id = ph.post_id
       JOIN hashtags h ON h.id = ph.hashtag_id
       JOIN users u ON u.id = ph.user_id
       WHERE h.tag_names = $1
      `, tagName)
   
    return search;
  } catch (error) {
    console.log(error);
    return error;
  }
};


const searchReply = async (tagName) => {
  try {
    const search = await db.any(`
      SELECT ph.*, h.tag_names,
      json_build_object(
        'content', r.content,
        'date_created', to_char(r.date_created, 'MM/DD/YYYY')
      ) as posts_details,
      json_build_object(
        'username', u.username,
        'profile_name', u.profile_name,
        'profile_img', u.profile_img
      ) as creator_details
      FROM post_hashtags ph
      JOIN replies r ON r.id = ph.reply_id
      JOIN hashtags h ON h.id = ph.hashtag_id
      JOIN users u ON u.id = ph.user_id
      WHERE h.tag_names = $1`,
      tagName
    );
    console.log(tagName);
    return search;
  } catch (error) {
    console.log(error);
    return error;
  }
};


  module.exports = {searchPost , searchReply}
  