const express = require("express")

const  {searchPost} = require("../queries/searchPost")

const search = express.Router()


search.get("/tag/:tagName", async (req, res) => {
  const { tagName } = req.params;

  console.log(tagName);
  try {
    const getPosts = await searchPost(`#${tagName}`);
    res.json(getPosts);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});



module.exports = search
