const express = require("express")

const {getAllFavorites , deleteFavorite} = require("../queries/favorites")


const fav = express.Router()

fav.get("/:id", async (req , res) =>{
    
const {id} = req.params

try{
    const allFav = await getAllFavorites(id)
    res.json(allFav)
}
catch(error){
    console.log(error)
    return error
}


})

fav.delete("/:userId/delete/:postId", async (req , res) => {
   
    const {userId, postId} = req.params

    const deleteFav = await deleteFavorite(userId , postId)

    if(deleteFav){
        res.status(200).json(deleteFav)
    }


})


module.exports = fav