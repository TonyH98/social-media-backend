const express = require("express")

const posts = require("./PostsController")

const {getAllUsers, getUser, newUser, loginUser} = require("../queries/users")

const users = express.Router()

users.use("/:username/posts", posts)

users.get("/", async (req ,res) => {
    const allUsers = await getAllUsers();

    const filter = req.query
    const filterUser = allUsers.filter(user => {
        let isValid = true
        for(key in filter){
            if(isNaN(filter[key])){
                isValid = isValid && (user[key].toLowerCase() == filter[key].toLowerCase())
            }
            else{
                isValid = isValid && (user[key] == parseInt(filter[key]))
            }
        }
        return isValid
    })
    res.send(filterUser)

})

users.get("/:id", async (req , res) => {
    const {id} = req.params;

    const user = await getUser(id)
    if(user){
        res.json(user)
    }
    else{
        res.status(404).json({error: "User not Found"})
    }

})

users.post("/signup", checkPassword, checkEmail, checkPhoneNumber, async(req , res) => {

    const user = await newUser(req.body);
    

    
    
    const {id , username} = user
    
    res.status(200).json({username, id});
    
    })
    
    users.post("/login", async (req , res) => {
        const user = await loginUser(req.body)
    
        if(user.username){
            const {id , username} = user
            res.status(200).json({message: "Login Successful", id, username});
        }
        else{
            res.status(401).json({message: "User Not Found"})
        }
    
    })


    module.exports = users