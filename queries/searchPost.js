const db = require("../db/dbConfig")

const searchPost = async (tagName) => {
  try {
    const search = await db.any(
      `SELECT ph.*, p.*, h.tag_names
      FROM post_hashtags ph
      JOIN posts p ON p.id = ph.post_id
     JOIN hashtags h ON h.id = ph.hashtag_id
      WHERE h.tag_names = $1`,
      tagName
    );
    console.log(tagName)
    return search;
  } catch (error) {
    console.log(error);
    return error;
  }
};




  module.exports = {searchPost}
  