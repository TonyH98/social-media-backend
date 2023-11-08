const express = require("express")

const {getAllFavoritesPosts, 
    getFavorites,  
    deleteFavorite, 
    addFavorites, 
    getAllFavoritesReplies, 
    addFavoritesReplies, 
    deleteFavoriteReplies,
    getAllFavorites} = require("../queries/favorites")


const fav = express.Router()

fav.get("/:id", async (req , res) =>{
    
const {id} = req.params

try{
    const allFav = await getAllFavoritesPosts(id)
    res.json(allFav)
}
catch(error){
    console.log(error)
    return error
}


})


fav.get("/:id/replies", async (req , res) =>{
    
    const {id} = req.params
    
    try{
        const allFav = await getAllFavoritesReplies(id)
        res.json(allFav)
    }
    catch(error){
        console.log(error)
        return error
    }
    
    
    })

fav.get("/:userId/post/:postId", async (req , res) =>{
    
    const {userId , postId} = req.params
    
    try{
        const allFav = await getFavorites(userId , postId)
        res.json(allFav)
    }
    catch(error){
        console.log(error)
        return error
    }
    
    
    })



fav.post("/:userId/fav/:postId", async (req , res) => {

const {userId , postId} = req.params

try{
    const fav = await addFavorites(userId , postId, req.body)

    res.json(fav)
}

catch(error){
    console.log(error)
    res.status(400).json({ error: error });
}

})


fav.post("/:userId/favR/:replyId", async (req , res) => {

    const {userId , replyId} = req.params
    
    try{
        const fav = await addFavoritesReplies(userId , replyId, req.body)
    
        res.json(fav)
    }
    
    catch(error){
        console.log(error)
        res.status(400).json({ error: error });
    }
    
    })

fav.delete("/:userId/delete/:postId", async (req , res) => {
   
    const {userId, postId} = req.params

    const deleteFav = await deleteFavorite(userId , postId)

    if(deleteFav){
        res.status(200).json(deleteFav)
    }


})


fav.delete("/:userId/deleteR/:replyId", async (req , res) => {
   
    const {userId, replyId} = req.params

    const deleteFav = await deleteFavoriteReplies(userId , replyId)

    if(deleteFav){
        res.status(200).json(deleteFav)
    }


})


fav.get("/:id/all", async (req , res) => {
    const {id} = req.params

    const getFav = await getAllFavorites(id)
    res.json(getFav)
})



module.exports = fav

