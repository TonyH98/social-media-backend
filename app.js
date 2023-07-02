const express = require('express')


const stripe = require("stripe")("sk_test_51McALmHgd5U2y6vdLJiKvnZq8wWKDvkf3LocRNeV3zVlUwUT0qu9DjPcMtVBIPymxhfvNTQTdbWtdl8ChFKC4oD500pYsmEHeG")

const cors = require('cors')

const app = express()

app.use(cors())

app.use(express.json())


const user = require("./controller/UsersController")

const note = require("./controller/notificationsController")

const favorite = require("./controller/favoritesController")

const follow = require("./controller/followController")

const plans = require("./controller/membershipController")


app.use("/users", user)

app.use("/notifications", note)

app.use("/favorites", favorite)

app.use("/follow", follow)

app.use("/plans", plans)

app.use("/", (req , res) => {
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
    //   success_url: "https://digital-commerce-site.netlify.app/success",
    //   cancel_url: "https://digital-commerce-site.netlify.app/"
    });
  
    res.status(200).send(JSON.stringify({
      url: session.url
    }))
    
    
  });


module.exports = app