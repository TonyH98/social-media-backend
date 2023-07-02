const db = require("../db/dbConfig")

const searchPost = async (hash) => {
    try {
      const search = await db.any(
        `SELECT p.id, p.user_name, p.user_id, p.content, p.content,
        json_build_object(
        'username', users.username,
          'profile_img', users.profile_img,
          'profile_name', users.profile_name
        )
        FROM posts p
        INNER JOIN post_hashtags ph ON p.id = ph.post_id
        INNER JOIN hashtags h ON ph.hashtag_id = h.id
        JOIN users ON users.id = p.user_id
        WHERE h.tag_names = $1
          AND p.content LIKE '%' || $1 || '%';`,
        hash
      );
      return search;
    } catch (error) {
      console.log(error);
      return error;
    }
  };


  module.exports = {searchPost}
  