const db = require("../db/dbConfig")


const nodemailer = require('nodemailer')

const password = process.env.Email_Password


const bcrypt = require('bcrypt')

const saltRounds = 10

const getAllUsers = async () => {
    try{
        const allUsers = await db.any("SELECT * FROM users")
        return allUsers
    }
    catch(err){
        console.log(err)
        return err
    }
}

const getUser = async(id) => {
    try{
        const oneUser = await db.one("SELECT * FROM users WHERE id=$1" , id);
        return oneUser
    }
    catch(err){
        return err
    }
}

const checkExistingUser = async (username , email) => {
    try{
        const result = await db.one(
            'SELECT * FROM users WHERE username =$1 OR email = $2',
            [username , email]
        )
        return result.rowCount > 0
    }
    catch(err){
        console.error(err)
    }
}

const generateVerificationCode = () => {
  return Math.floor(10000 + Math.random() * 90000)
}

const sendVerificationEmail = async (email, verificationCode) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
    user: 'tonyhoangtesting@gmail.com',
    pass: password
  }

  });

  let mailOptions = {
      from: 'Tony Hoang <tonyhoangtesting@gmail.com>',
      to: email,
      subject: 'Verification Code for Sign-up',
      text: `Your verification code is: ${verificationCode}`,
  };

  try {
      let info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
  } catch (error) {
      console.log(error);
      throw new Error('Failed to send verification email.');
  }
};




let userTemporaryStorage = {}; // Temporary storage for user data

const newUser = async (user) => {
  const { username, firstname, lastname, email, profile_img, banner_img, DOB, bio, profile_name, password } = user;

  try {
    const userExist = await checkExistingUser(username, email);
    if (userExist) {
      throw new Error('Username or email already exists');
    }
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateVerificationCode();
    const hashedVerificationCode = await bcrypt.hash(verificationCode.toString(), salt);

    // Store user data in temporary storage
    userTemporaryStorage = {
      username,
      firstname,
      lastname,
      email,
      profile_img,
      banner_img,
      DOB,
      bio,
      profile_name,
      hashedPassword,
      hashedVerificationCode,
      currentTimes: new Date()
    };

    await sendVerificationEmail(email, verificationCode);
    return 'Verification code sent to your email. Please check your inbox.';
  } catch (err) {
    console.log(err);
    throw err; 
  }
};


const verifyUser = async (email, verificationCode) => {
  const storedUser = userTemporaryStorage;

  if (!storedUser || storedUser.email !== email) {
    throw new Error('User data not found in temporary storage');
  }

  let fiveMinute = 5 * 60 * 1000
  let currentTime = new Date()
  let timeLaspe = currentTime - storedUser.currentTimes

  if(timeLaspe > fiveMinute){
    userTemporaryStorage = {}
    throw new Error("Code Expired")
  }

  const isCodeMatched = await bcrypt.compare(verificationCode.toString(), storedUser.hashedVerificationCode);

  if (isCodeMatched) {
    await db.query(
      `INSERT INTO users 
        (username, firstname, lastname, email, profile_img, banner_img, DOB, bio, profile_name, notifications, dark_mode, password, verification) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        storedUser.username,
        storedUser.firstname,
        storedUser.lastname,
        storedUser.email,
        storedUser.profile_img,
        storedUser.banner_img,
        storedUser.DOB,
        storedUser.bio,
        storedUser.profile_name,
        false,
        false,
        storedUser.hashedPassword,
        storedUser.hashedVerificationCode,
      ]
    );

    userTemporaryStorage = {};
    return 'User created successfully';
  } else {
    throw new Error('Incorrect verification code.');
  }
};




const loginUser = async (user) => {

    const {password , email} = user

    try {
        const oneUser = await db.one(
            "SELECT * FROM users WHERE email=$1",
            email
        );
        
        // Check if the user's information exists in the database and if the provided password matches the one stored in the database.
        if (oneUser && await bcrypt.compare(password, oneUser.password)) {
            const {email, id} = oneUser;
            console.log(oneUser)
            return {email, id };
        } else {
            throw new Error("Invalid email or password.");
        }
    }
    catch (err) {
        return err.message;
    }

}




const editUser = async (id , user) => {
    try{
        const editUser = await db.one(
            'UPDATE users SET username=$1, firstname=$2, lastname=$3, profile_img = $4, banner_img=$5, bio=$6, profile_name=$7, notifications = $8, dark_mode = $9 WHERE id=$10 RETURNING *',
            [user.username, user.firstname, user.lastname, user.profile_img, user.banner_img, user.bio, user.profile_name, user.notifications, user.dark_mode, id]
        )
        return editUser
    }
    catch(error){
      console.log(error)
        return error
    }
}


const getInterestsFromUsers = async (id) => {
    try {
      const getinterest= await db.any(
        `SELECT users_interests.users_id, users_interests.added, 
        users_interests.interests_id, interests.name 
        FROM users_interests
        JOIN interests ON interests.id =  users_interests.interests_id 
        JOIN users ON users.id = users_interests.users_id 
        WHERE users.id = $1`,
        [id]
      );
      return getinterest;
    } catch (error) {
      return error;
    }
  };
  
  const getInterestFromUserByIndex = async (userId, interestId) => {
    try {
      const getInterest = await db.oneOrNone(
        `SELECT users_interests.users_id, users_interests.added, 
        users_interests.interests_id, interests.name 
        FROM users_interests
        JOIN interests ON interests.id =  users_interests.interests_id 
        JOIN users ON users.id = users_interests.users_id 
        WHERE users.id = $1 AND category_id = $2`,
        [userId, interestId]
      );
  
      if (!getInterest) {
        throw new Error("Category not found");
      }
  
      return getInterest;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  
  const addInterestToUser = async (userId, interestId) => {
    try {
      const add = await db.none(
        `INSERT INTO users_interests (users_id, interests_id, added) VALUES($1 , $2, $3)`,
        [userId, interestId, true]
      );
      return !add;
    } catch (error) {
      return error;
    }
  };
  
  const deleteInterestsFromUsers = async (userId, interestsId) => {
    try {
      const deletes = await db.one(
        `DELETE FROM users_interests WHERE users_id = $1 AND interests_id =$2 RETURNING *`,
        [userId, interestsId]
      );
      return deletes;
    } catch (error) {
      return error;
    }
  };





module.exports={
    getAllUsers,
    getUser,
    newUser,
    loginUser,
    editUser,
    getInterestFromUserByIndex,
    getInterestsFromUsers,
    addInterestToUser,
    deleteInterestsFromUsers,
    verifyUser
}