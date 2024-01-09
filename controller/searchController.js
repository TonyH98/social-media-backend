const express = require("express")

const  {searchPost , searchReply, getAllSearchPosts, searchPoll} = require("../queries/searchPost")

const search = express.Router()


search.get("/post/:tagName", async (req, res) => {
  const { tagName } = req.params;

  try {
    const getPosts = await searchPost(`#${tagName}`);
    res.json(getPosts);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});


search.get("/replies/:tagName", async (req, res) => {
  const { tagName } = req.params;


  try {
    const getPosts = await searchReply(`#${tagName}`);
    res.json(getPosts);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});


search.get("/poll/:tagName", async (req, res) => {
  const { tagName } = req.params;
  try {
    const getPosts = await searchPoll(`#${tagName}`);
    res.json(getPosts);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});


search.get("/all/:tagName" , async (req ,res) => {

  const { tagName } = req.params;

  console.log(tagName);
  try {
    const getPosts = await getAllSearchPosts(`#${tagName}`);
    res.json(getPosts);
  } catch (error) {
    console.log(error);
    res.json(error);
  }

})



module.exports = search
