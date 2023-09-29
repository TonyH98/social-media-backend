DROP DATABASE IF EXISTS social;
CREATE DATABASE social;

\c social;

DROP TABLE IF EXISTS users; 
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_img TEXT,
    banner_img TEXT,
    DOB DATE,
    bio TEXT,
    profile_name TEXT,
    notifications BOOLEAN DEFAULT FALSE,
    date_created DATE DEFAULT CURRENT_DATE,
    links TEXT,
    password TEXT NOT NULL
);


DROP TABLE IF EXISTS interests;
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30)
);


DROP TABLE IF EXISTS users_interests;

CREATE TABLE users_interests(
    users_id INTEGER,
    interests_id INTEGER,
    added BOOLEAN NOT NULL,
    UNIQUE (users_id, interests_id)
);



DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_name TEXT REFERENCES users(username),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    posts_img TEXT,
    date_created DATE DEFAULT CURRENT_DATE
);


DROP TABLE IF EXISTS hashtags;
CREATE TABLE hashtags(
    id SERIAL PRIMARY KEY,
    tag_names TEXT,
    CONSTRAINT unique_tag_name UNIQUE (tag_names)
);





DROP TABLE IF EXISTS post_reactions;
CREATE TABLE post_reactions (
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER REFERENCES posts(id),
    post_username TEXT REFERENCES users(username),
    reaction_type VARCHAR(10) CHECK (reaction_type IN ('like', 'dislike'))
);



DROP TABLE IF EXISTS replies;
CREATE TABLE replies(
    id SERIAL PRIMARY KEY,
    posts_id INTEGER REFERENCES posts(id),
    user_id INTEGER REFERENCES users(id),
    content VARCHAR(500) NOT NULL,
    date_created DATE DEFAULT CURRENT_DATE
);

DROP TABLE IF EXISTS post_hashtags;
CREATE TABLE post_hashtags (
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER REFERENCES posts(id),
    reply_id INTEGER REFERENCES replies(id),
    hashtag_id INTEGER REFERENCES hashtags(id)
);



DROP TABLE IF EXISTS favorite_posts;
CREATE TABLE favorite_posts(
    favorites BOOLEAN DEFAULT TRUE,
    selected BOOLEAN DEFAULT FALSE,
    users_id INTEGER REFERENCES users(id),
    creator_id INTEGER,
    posts_id INTEGER
);

DROP TABLE IF EXISTS users_followers;
CREATE TABLE users_followers(
    follow BOOLEAN DEFAULT TRUE,
    selected BOOLEAN DEFAULT FALSE,
    added BOOLEAN DEFAULT TRUE,
    user_id INTEGER REFERENCES users(id),
    following_id INTEGER REFERENCES users(id),
    UNIQUE(user_id, following_id, added)
);

DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications(
    id SERIAL PRIMARY KEY,
    users_id INTEGER REFERENCES users(id),
    sender_id INTEGER REFERENCES users(id),
    posts_id INTEGER REFERENCES posts(id),
    reply_id INTEGER REFERENCES replies(id),
    is_read BOOLEAN DEFAULT FALSE,
    selected BOOLEAN DEFAULT FALSE
);


DROP TABLE IF EXISTS memberships;
CREATE TABLE memberships(
    id SERIAL PRIMARY KEY,
    product_name TEXT,
    images TEXT,
    description TEXT,
    price INTEGER
);

DROP TABLE IF EXISTS users_memberships;
CREATE TABLE users_memberships(
    user_id INTEGER REFERENCES users(id),
    memberships_id INTEGER REFERENCES memberships(id),
    date_created DATE DEFAULT CURRENT_DATE,
    quantity INTEGER DEFAULT 1
);