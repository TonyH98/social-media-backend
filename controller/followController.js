const express = require("express")

const{getAllFollowing, addFollowingToUser, deletePersonFromUsers, getAllFollowers} = require("../queries/follower")

const follow = express.Router()

follow.get("/:userId", async(req , res) => {

    const {userId} = req.params

    try{
        const allFollowing = await getAllFollowing(userId)
        res.json(allFollowing)
    }
    catch(error){
        console.log(error)
        return error
    }
})

follow.post("/:userId/follow/:followId", async(req , res) => {

    const {userId , followId} = req.params

    const addUser = await addFollowingToUser(userId , followId)

    if (addUser) {
        res.json({ message: "User Added" });
      } else {
        res.json({ error: "User not added" });
      }
})

follow.delete("/:userId/delete/:followId", async (req , res) => {

    const { userId, followId } = req.params;

    const deleteUser = await deletePersonFromUsers(userId, followId);
  
    if (deleteUser) {
      res.status(200).json(deleteUser);
    }


})


follow.get("/:userId/followers/:followId", async(req , res) => {

  const {userId , followId} = req.params

  try{
      const allFollowers = await getAllFollowers(userId , followId)
      res.json(allFollowers)
  }
  catch(error){
      console.log(error)
      return error
  }
})



module.exports = follow