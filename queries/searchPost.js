const db = require("../db/dbConfig")

const searchPost = async (tagName) => {
  try {
    const search = await db.any(

      `SELECT ph.post_id AS id, ph.user_id,
       ph.reply_id, ph.hashtag_id, p.user_name,
        p.content, p.posts_img, p.gif, p.url, p.url_title, p.url_img, h.tag_names,
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
      SELECT ph.reply_id AS id, ph.user_id, ph.hashtag_id,
      h.tag_names, r.content, r.gif, r.posts_img, u.username, r.posts_id,
     to_char(r.date_created, 'MM/DD/YYYY') AS time, r.url, r.url_title, r.url_img,
      json_build_object(
        'username', u.username,
        'profile_name', u.profile_name,
        'profile_img', u.profile_img,
        'id', u.id
      ) as creator
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


const getAllSearchPosts = async (tagName) => {

try{

  const getAllSearch = await db.any(
    `SELECT ph.post_id, ph.reply_id ,
     h.tag_names FROM post_hashtags ph 
     JOIN hashtags h ON h.id = ph.hashtag_id 
     WHERE h.tag_names = $1`, 
    [tagName]
    )
    let searchArr = {}

    for(let search of getAllSearch){
        if(search.post_id){
          const search = await db.any(
            `SELECT ph.id AS search_id, ph.post_id AS id, ph.user_id,
             ph.reply_id, ph.hashtag_id, p.user_name, p.url, p.url_title, p.url_img,
              p.content, p.posts_img, p.gif, p.repost_counter, h.tag_names, ph.post_id AS posts_id,
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
            `, 
            [tagName]
            )
            for(let s of search){
              if(!searchArr[s.search_id]){
                  searchArr[s.search_id] = s
              }
          }
        }
        else{
          const search = await db.any(`
          SELECT ph.id AS search_id, ph.reply_id AS id, ph.user_id, ph.hashtag_id,
          h.tag_names, r.content, r.gif, r.posts_img, u.username, 
          r.url, r.url_title, r.url_img,
         to_char(r.date_created, 'MM/DD/YYYY') AS time, ph.reply_id,
          json_build_object(
            'username', u.username,
            'profile_name', u.profile_name,
            'profile_img', u.profile_img,
            'id', u.id,
            'posts_id', r.posts_id
          ) as creator
          FROM post_hashtags ph
          JOIN replies r ON r.id = ph.reply_id
          JOIN hashtags h ON h.id = ph.hashtag_id
          JOIN users u ON u.id = ph.user_id
          WHERE h.tag_names = $1`,
          [tagName]
        );
        for(let s of search){
          if(!searchArr[s.search_id]){
              searchArr[s.search_id] = s
          }
      }

        }


    }
    return Object.values(searchArr)
}

catch(error){
  console.log(error)
  return error
}
}


  module.exports = {searchPost , searchReply, getAllSearchPosts}
  
