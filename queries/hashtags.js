const db = require("../db/dbConfig")


const getAllTags = async () => {
    try{
        const allTags = await db.any(
            `SELECT * FROM hashtags`
        )
        return allTags
    }
    catch(error){
        console.log(error)
        return error
    }
}

module.exports = {getAllTags}