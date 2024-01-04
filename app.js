const express = require('express')

require("dotenv").config()

const stripeKey = process.env.STRIPE_SECRET_KEY



const stripe = require("stripe")(stripeKey)

const cors = require('cors')

const app = express()

app.use(cors())

app.use(express.json())


const user = require("./controller/UsersController")

const note = require("./controller/notificationsController")

const favorite = require("./controller/favoritesController")

const follow = require("./controller/followController")

const plans = require("./controller/membershipController")

const search = require("./controller/searchController")

const tags =  require("./controller/hashTagsController")



const block = require("./controller/blockController")

const poll = require("./controller/pollController")

app.use("/users", user)

app.use("/notifications", note)

app.use("/favorites", favorite)

app.use("/follow", follow)

app.use("/plans", plans)

app.use("/search", search)

app.use("/tags", tags)



app.use("/block", block)

app.use("/poll", poll)

app.get("/", (req , res) => {
    res.send("Welcome to the social media app")
})

const isAuthenticated = (req , res , next) => {
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/users')
}

app.post('/logout', isAuthenticated, (req , res) => {
    req.session.destroy((err) => {
        if(err){
            console.log(err)
        }
        res.redirect('/users')
    })
})


app.post('/create-checkout-session', async (req, res) => {
    const { items } = req.body;
    console.log("Request body:", req.body);
  
    const lineItems = items.map((item) => {
  
      const unitAmount = Math.round(parseFloat(item.price) * 100);
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product_name,
            images: [item.image],
          },
          unit_amount_decimal: unitAmount
        },
        quantity: item.quantity,
      };
    });
    
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
       success_url: "http://localhost:3000",
       cancel_url:  "http://localhost:3000"
    });
  
    res.status(200).send(JSON.stringify({
      url: session.url
    }))
    
    
  });


module.exports = app