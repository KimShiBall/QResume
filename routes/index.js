var express = require('express');
var router = express.Router();
var User = require('../models/user');
var mid = require('../middleware');
var fs = require('fs');
var path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');


//storage handling
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
          //return res.render('profile', { title: 'Profile', name: user.name, email: user.email });
          return res.redirect('/profile/' + user.email);
        }
      });
});

router.get('/profile/:email', function (req, res) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          
          req.session.profilePic = getProfilePicture(user);
          req.session.pdfName = getPDF(user);

          return res.render('profile', { title: 'Profile', name: user.name, email: user.email, 
          profilePic: req.session.profilePic, pdfName: req.session.pdfName });
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
    res.render('uploads', { email: req.session.email, profilePic: req.session.profilePic, pdfName: req.session.pdfName});
});

// POST /uploads
router.post('/uploads', upload.single('image'), (req, res, next) => {
  return res.render('uploads', {email: req.session.email, profilePic: req.session.profilePic, pdfName: req.session.pdfName})
});

// POST /update
router.post('/update', (req, res, next) => {

  var userData = {
    github: req.body.github,
    linkedin: req.body.linkedin,
    handshake: req.body.handshake,
    facebook: req.body.facebook,
    twitter: req.body.twitter,
    instagram: req.body.instagram };
  
  User.findOneAndUpdate({email: req.session.email}, userData)
    .exec(function(error, user){
      if(error){

      }

      else{
        
      }
    })

    return res.render('uploads', {email: req.session.email, profilePic: req.session.profilePic, pdfName: req.session.pdfName})
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
                  instagram: "" };
        
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
  
module.exports = router;