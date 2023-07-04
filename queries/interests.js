const db = require("../db/dbConfig")

const getAllInterests = async () => {
    try{
        const allInterests = await db.any('SELECT * FROM interests')
        return allInterests
    }
    catch(error){
        return error
    }
}

const getInterets = async (id) => {
    try{
        const interests = await db.one('SELECT * FROM interests WHERE id=$1', id)
        return interests
    }
    catch(error){
        return error
    }
}

module.exports={getAllInterests , getInterets}