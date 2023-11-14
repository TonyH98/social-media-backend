
const db = require("../db/dbConfig")



const getAllPostNotifications = async (user_id) => {
  try {
    const allNote = await db.any(
      `SELECT notifications.id AS note_id, notifications.sender_id AS users_id,
       posts.content, to_char(posts.date_created, 'MM/DD/YYYY') AS time,
      notifications.posts_id AS id, notifications.reply_id, 
      notifications.is_read, notifications.selected,
      json_build_object(
          'username', users.username,
          'profile_img', users.profile_img,
          'profile_name', users.profile_name,
          'posts_img', posts.posts_img,
          'gif', posts.gif,
          'repost_counter', posts.repost_counter
      ) AS creator
      FROM notifications
      JOIN posts ON posts.id = notifications.posts_id
      JOIN users ON users.id = notifications.sender_id
      WHERE notifications.users_id = $1`,
      user_id
    );
    console.log(allNote)
    return allNote;
  } catch (error) {
    console.log(error);
    return error;
  }
};
  

const getAllReplyNotifications = async (user_id) => {
    try{
        const allNote = await db.any(
            `SELECT notifications.id, notifications.sender_id, notifications.users_id,
            notifications.reply_id, notifications.is_read, notifications.selected,
            json_build_object(
                'content', replies.content,
                'date_created', to_char(replies.date_created, 'MM/DD/YYYY'),
                'username', users.username,
                'profile_img', users.profile_img,
                'profile_name', users.profile_name,
                'post_img', replies.posts_img,
                'gif', replies.gif,
                'posts_id', replies.posts_id
            ) AS post_content 
            FROM notifications
            JOIN replies ON replies.id = notifications.reply_id 
            JOIN users ON users.id = notifications.sender_id
            WHERE notifications.users_id = $1`, 
            user_id
        );
        return allNote
    }
    catch(error){
        console.log(error)
        return error
    }
}


const getAllNotifiacions = async (user_id) => {
    try{
        
        const getAllNote = await db.any(
            `SELECT posts_id , reply_id FROM notifications WHERE notifications.users_id = $1`, 
            [user_id]
            )
            let noteArr = {}
        for(let note of getAllNote){
            if(note.posts_id){
                const allNote = await db.any(
                    `SELECT notifications.id AS note_id, notifications.sender_id AS users_id, posts.content, notifications.reply_id,
                    to_char(posts.date_created, 'MM/DD/YYYY') AS time,
                    notifications.posts_id AS id, notifications.is_read, notifications.selected,
                    json_build_object(
                        'username', users.username,
                        'profile_img', users.profile_img,
                        'profile_name', users.profile_name,
                        'posts_img', posts.posts_img,
                        'gif', posts.gif,
                        'repost_counter', posts.repost_counter
                    ) AS creator
                    FROM notifications
                    JOIN posts ON posts.id = notifications.posts_id
                    JOIN users ON users.id = notifications.sender_id
                    WHERE notifications.users_id = $1`,
                    [user_id]
                  );
                  for(let note of allNote){
                      if(!noteArr[note.note_id]){
                          noteArr[note.note_id] = note
                      }
                  }
            }
            else{
                const allNote = await db.any(
                    `SELECT notifications.id AS note_id, notifications.sender_id AS users_id, replies.content,
                    to_char(replies.date_created, 'MM/DD/YYYY') AS time,
                    notifications.reply_id AS id, notifications.is_read, notifications.selected,notifications.reply_id,
                    json_build_object(
                        'username', users.username,
                        'profile_img', users.profile_img,
                        'profile_name', users.profile_name,
                        'posts_img', replies.posts_img,
                        'gif', replies.gif,
                        'posts_id', replies.posts_id
                    ) AS creator 
                    FROM notifications
                    JOIN replies ON replies.id = notifications.reply_id 
                    JOIN users ON users.id = notifications.sender_id
                    WHERE notifications.users_id = $1`, 
                    [user_id]
                );
                for(let note of allNote){
                    if(!noteArr[note.note_id]){
                        noteArr[note.note_id] = note
                    }
                }
            }
        }
        return Object.values(noteArr)
    }
    catch(error){
        console.log(error)
        return error 
    }
}


const deleteNotifications = async (id) => {
    try{
        const deleteNote = await db.one(
            'DELETE FROM notifications WHERE id = $1 RETURNING *', id
        )
        return deleteNote
    }
    catch(error){
        console.log(error)
        return error
    }
}

const editNotifications = async (note, id) => {
    try {
        const getNote = await db.one(
            `SELECT id, is_read FROM notifications WHERE id = $1`,
            [id]
        );

        if (getNote.is_read) {
            throw new Error("Notification already marked as read");
        } else {
            const editNote = await db.one(  
                `UPDATE notifications SET is_read=$1 WHERE id=$2 RETURNING *`,
                [note.is_read, id]
            );

            return editNote;
        }
    } catch (error) {
        console.log(error);
        return error;
    }
};


module.exports = {getAllPostNotifications, deleteNotifications, getAllReplyNotifications, editNotifications, getAllNotifiacions}
