var express = require('express');
var router = express.Router();
var User = require('../models/user');
var imgModel = require('../models/upload');
var mid = require('../middleware');
var fs = require('fs');
var path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');

//storage handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/PDFs')
  },
  filename: (req,file,cb) => {
    cb(null, file.fieldname + '-' + Date.now() + ".jpg") // change file name
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
          return res.render('profile', { title: 'Profile', name: user.name, email: user.email });
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
router.get('/uploads', (req, res) => {
  imgModel.find({}, (err, items) => {
    if (err) {
        console.log(err);
        res.status(500).send('An error occurred', err);
    }
    else {
        res.render('uploads', { items: items });
    }
  });  
});

// POST /uploads
router.post('/uploads', upload.single('image'), (req, res, next) => {
  
  var obj = {
      name: req.body.name,
      desc: req.body.desc,
      img: {
          data: fs.readFileSync(path.join(__dirname + '/../public/PDFs/' + req.file.filename)),
          contentType: 'image/png'
      }
  }
  imgModel.create(obj, (err, item) => {
      if (err) {
          console.log(err);
      }
      else {
          // item.save();
          res.redirect('/uploads');
      }
  });
});

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
                  password: req.body.password };
        
                // use schema's `create` method to insert document into Mongo
                User.create(userData, function (error, user) {
                  if (error) {
                    return next(error);
                  } else {
                    req.session.userId = user._id;
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
    return res.render('index', { title: 'Home' });
});

// GET /about
router.get('/about', function(req, res, next) {
    return res.render('about', { title: 'About' });
  });
  
// GET /contact
router.get('/contact', function(req, res, next) {
    return res.render('contact', { title: 'Contact' });
});
  
module.exports = router;