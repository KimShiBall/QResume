var express = require('express');
var router = express.Router();
var User = require('../models/user');
var mid = require('../middleware');
var fs = require('fs');
var path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');


//storage handling
//Depending on the file extension, it needs to place them in certain directories
//and updates the file name appropriately
const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    if(file.originalname.includes(".pdf") || file.originalname.includes(".PDF")){
      cb(null, 'public/PDFs')
    }
    
    else{
      cb(null, 'public/images')
    }
    
  },

  filename: (req,file,cb) => {
    if(file.originalname.includes(".pdf") || file.originalname.includes(".PDF")){
      cb(null, req.session.email + ".pdf")
    }
    else{
      cb(null, req.session.email + ".jpg") // change file name
    }
    
  }
});
const upload = multer({ storage: storage });

// GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {

          req.session.profilePic = getProfilePicture(user);
          req.session.pdfName = getPDF(user);

          return res.render('profile', { title: 'Profile', name: user.name, email: user.email, 
          profilePic: req.session.profilePic, pdfName: req.session.pdfName, links: getUserLinks(user), linkColor: logoColoring(getUserLinks(user)) });
        }
      });
});

// GET /logout
router.get('/logout', function(req, res, next) {
    if (req.session) {
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
          return next(err);
        } else {
          return res.redirect('/');
        }
      });
    }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
    return res.render('login', { title: 'Log In'});
});

// GET /uploads
router.get('/uploads', mid.requiresLogin, (req, res) => {
    res.render('uploads', {title: "Upload", email: req.session.email, profilePic: req.session.profilePic, pdfName: req.session.pdfName});
});

// POST /uploads
router.post('/uploads', upload.single('image'), (req, res, next) => {
  return res.render('uploads', {title: "Upload", email: req.session.email, profilePic: req.session.profilePic, pdfName: req.session.pdfName})
});

// POST /update
router.post('/update', (req, res, next) => {

  var userData;

  //Find the user
  User.findOne({email: req.session.email})
    .exec(function(error, user){
      if(error){

      }

      else{
        //Then update the user's links
        userData = updateUserLinks(user, req);

        //Then replace the existing links with the new links
        User.findOneAndUpdate({email: req.session.email}, userData)
        .exec(function(error, user){
          if(error){

          }

          else{
        
          }
        })
      }
    })
  
  

    return res.render('uploads', {title: "Upload", email: req.session.email, profilePic: req.session.profilePic, pdfName: req.session.pdfName})
})

// POST /login
router.post('/login', function(req, res, next) {
    if (req.body.email && req.body.password) {
      User.authenticate(req.body.email, req.body.password, function (error, user) {
        if (error || !user) {
          var err = new Error('Wrong email or password.');
          err.status = 401;
          return next(err);
        }  else {
          req.session.userId = user._id;
          req.session.email = user.email;
          req.session.profilePic = getProfilePicture(user);
          req.session.pdfName = getPDF(user);
          return res.redirect('/profile');
        }
      });
    } else {
      var err = new Error('Email and password are required.');
      err.status = 401;
      return next(err);
    }
});

// GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
    return res.render('register', { title: 'Sign Up' });
});

// POST /register
router.post('/register', function(req, res, next) {
    if (req.body.email &&
      req.body.name &&
      req.body.password &&
      req.body.confirmPassword) {
        
        var emailAlreadyInUse = false;

        // confirm that user typed same password twice
        if (req.body.password !== req.body.confirmPassword) {
          var err = new Error('Passwords do not match.');
          err.status = 400;
          return next(err);
        }

        //Ensure that the email hasn't already been used
        User.findOne({ email: req.body.email.toLowerCase() })
          .exec(function (error, user) {
            if (error) {
              return callback(error);
            } else if ( user != null ) {

              var err = new Error('Email already in use.');
              err.status = 400;
              emailAlreadyInUse = true;
              return next(err);
            }

            else{

             if(!emailAlreadyInUse){
                // create object with form input
                var userData = {
                  email: req.body.email.toLowerCase(),
                  name: req.body.name,
                  password: req.body.password,
                  github: "",
                  linkedin: "",
                  handshake: "",
                  facebook: "",
                  twitter: "",
                  instagram: "",
                  youtube: "",
                  reddit: "" };
        
                // use schema's `create` method to insert document into Mongo
                User.create(userData, function (error, user) {
                  if (error) {
                    return next(error);
                  } else {
                    req.session.userId = user._id;
                    req.session.userEmail = user.email;
                    req.session.profilePic = getProfilePicture(user);
                    req.session.pdfName = getPDF(user);

                    return res.redirect('/profile');
                  }
                });
              }

            }
          });

      } else {
        var err = new Error('All fields required.');
        err.status = 400;
        return next(err);
      }
})

// GET /
router.get('/', function(req, res, next) {
  if(req.session != null){
    return res.render('index', {title: 'Home', email: req.session.email, profilePic: req.session.profilePic})
  } 
  
  else{
    return res.render('index', { title: 'Home' });
  }
  
});

// GET /about
router.get('/about', function(req, res, next) {
  if(req.session != null){
    return res.render('about', {title: 'About', email: req.session.email, profilePic: req.session.profilePic})
  }  
  else{
    return res.render('about', { title: 'About' });
  }
  
  });
  
// GET /contact
router.get('/contact', function(req, res, next) {
  if(req.session != null){
    return res.render('contact', {title: 'Contact', email:req.session.email, profilePic: req.session.profilePic})
  } 
  
  else{
    return res.render('contact', { title: 'Contact' });
  }
  
});

//Checks if the current user has a profile picture, if they do it returns the user's email.
//Otherwise, it returns the default profile picutre.
function getProfilePicture(user){
  
  try{

    if(fs.existsSync(path.join(__dirname + '/../public/images/' + user.email + ".jpg"))){ 
      return user.email;
     }

     else{
      return "avatar";
     }

  }catch(err){
    return next(err);
  }

}

//Checks if the current user has a pdf, if they do it returns the user's email.
//Otherwise, it returns the default pdf's name
function getPDF(user){
    try{
      if(fs.existsSync(path.join(__dirname + '/../public/PDFs/' + user.email + ".pdf"))){
          return user.email;
        }

        else{
          return "Default";
        }

    }catch(err){
      
    }
}

//Called when the user presses the update button on the uploads page.
//Only updates links that have strings and returns the list of strings, including unchanged strings.
function updateUserLinks(user, req){
  var links = getUserLinks(user);

  if(req.body.github != ""){
    links.github = req.body.github
  }

  if(req.body.linkedin != ""){
    links.linkedin = req.body.linkedin
  }

  if(req.body.handshake != ""){
    links.handshake = req.body.handshake
  }

  if(req.body.facebook != ""){
    links.facebook = req.body.facebook
  }

  if(req.body.twitter != ""){
    links.twitter = req.body.twitter
  }

  if(req.body.instagram != ""){
    links.instagram = req.body.instagram
  }

  if(req.body.youtube != ""){
    links.youtube = req.body.youtube
  }

  if(req.body.reddit != ""){
    links.reddit = req.body.reddit
  }

  return links
}

//Grabs all of the links of the current user
function getUserLinks(user){
  var links = {
    github: user.github,
    linkedin: user.linkedin,
    handshake: user.handshake,
    facebook: user.facebook,
    twitter: user.twitter,
    instagram: user.instagram,
    youtube: user.youtube,
    reddit: user.reddit
  }

  return links;
}

//Used to determine whether the link blocks on the profile page should be fully colored or grayed out.
function logoColoring(links){
  var grayedOut = "grayout";
  var colored = "logo_link";

  var linkColor = {
      github: "",
      linkedin: "",
      handshake: "",
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      reddit: ""
  }
  

  if(links.github != ""){
    linkColor.github = colored;
  }

  else{
    linkColor.github = grayedOut
  }


  if(links.linkedin != ""){
    linkColor.linkedin = colored;
  }

  else{
    linkColor.linkedin = grayedOut
  }


  if(links.handshake != ""){
    linkColor.handshake = colored;
  }

  else{
    linkColor.handshake = grayedOut
  }


  if(links.facebook != ""){
    linkColor.facebook = colored;
  }

  else{
    linkColor.facebook = grayedOut
  }


  if(links.twitter != ""){
    linkColor.twitter = colored;
  }

  else{
    linkColor.twitter = grayedOut
  }


  if(links.instagram != ""){
    linkColor.instagram = colored;
  }

  else{
    linkColor.instagram = grayedOut
  }


  if(links.youtube != ""){
    linkColor.youtube = colored;
  }

  else{
    linkColor.youtube = grayedOut
  }


  if(links.reddit != ""){
    linkColor.reddit = colored;
  }

  else{
    linkColor.reddit = grayedOut
  }

  return linkColor;
}
  
module.exports = router;