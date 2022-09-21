// index.js

/**
 * Required External Modules
 */
 const express = require("express");
 const path = require("path");
 const bodyParser = require("body-parser");
 const mongoose = require("mongoose");
 require("./models/Registration");
 require("dotenv").config();

/**
 * App Variables
 */
 const app = express();
 const port = process.env.PORT || "8000";
 const { check, validationResult} = require('express-validator');
 const Registration = mongoose.model("Registration");

/**
 *  App Configuration
 */
 app.engine('pug', require('pug').__express)

 app.set("views", path.join(__dirname, "views"));
 app.set("view engine", "pug");
 app.use(express.static("public"));
 app.use(bodyParser.urlencoded({extended : true}));


 mongoose.connect(process.env.DATABASE, {
   useNewUrlParser: true,
   useUnifiedTopology: true
 });
 
 mongoose.connection

/**
 * Routes Definitions
 */
 //app.get("/", (req, res) => {
 //   res.status(200).send("QResume Testing");
 //});
 app.get("/", (req, res) => {
    res.render("index", { title: "Home" });
 });

 /*app.get("/user", (req, res) => {
    res.render("user", { title: "Profile", userProfile: { nickname: "Dummy" } });
 });*/

 app.post("/",
   [
      check('name')
          .isLength({ min : 1})
          .withMessage('Please enter a name'),
      check('email')
          .isLength({ min : 1})
          .withMessage('Please enter an email'),
  ], 
  (req, res) => {
          const errors = validationResult(req);

          if (errors.isEmpty()){
              const registration = new Registration(req.body);
              registration.save()
              
          } else{
              res.render('form', {
                  title: 'Resgistration form',
                  errors: errors.array(),
                  data: req.body,
              });
          }   
   
   console.log(req.body)
   res.render("user", {title: "Profile", userProfile: {nickname: req.body.name}});
 });

/**
 * Server Activation
 */
 app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
 });