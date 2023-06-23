\c social;


DROP TABLE IF EXISTS users; 
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phonenumber TEXT NOT NULL,
    profile_img TEXT,
    banner_img TEXT,
    DOB TEXT,
    bio TEXT,
    profile_name TEXT,
    password TEXT NOT NULL
);

DROP TABLE IF EXISTS posts;
CREATE TABLE posts(
    users_id INTEGER REFERENCES users(id);
    posts VARCHAR(300) NOT NULL;
)