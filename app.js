//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require("passport-facebook").Strategy;
const multer = require('multer');
var upload = multer({ dest: 'uploads/' })

const app = express();
var router = express.Router();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/backroomDB", {useNewUrlParser: true, useUnifiedTopology: true});

// app.use(multer({ dest: "uploads/",
//  rename: function (fieldname, filename) {
//    return filename;
//  },
// }));

const postSchema = new mongoose.Schema ({
  location: String,
  price: Number,
  occupation: String,
  gender: String,
  singleOrSharing: String,
  roomPic: { data: Buffer, contentType: String },
  description: String
});

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  fullNames: String,
  contact: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  Post.find({}, function(err, posts){
    res.render("index", {
      posts: posts
      });
  });
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/post");
  });

app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ["profile"] })
  );

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
    });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
res.render("register");
});

app.get("/post", function(req, res) {
res.render("post");
});

app.get("/room", function(req, res) {
  res.render("room");
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/contact", function(req, res){
  res.render("contact");
});

app.post("/post", function(req, res) {
  const post = new Post({
    location: req.body.location,
    price: req.body.price,
    occupation: req.body.occupation,
    gender: req.body.gender,
    singleOrSharing: req.body.singleOrSharing,
    roomPic: req.body.roomPic,
    description: req.body.description
    });

    post.save(function(err){
      if (!err){
          res.redirect("/");
      }
    });
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      location: req.body.location,
      price: req.body.price,
      occupation: req.body.occupation,
      gender: req.body.gender,
      singleOrSharing: req.body.singleOrSharing,
      roomPic: req.body.roomPic,
      description: req.body.description
    });
  });

});
app.post("/api/photo", function(req,res){
 var newItem = new Item();
 newItem.img.data = fs.readFileSync(req.files.userPhoto.path)
 newItem.img.contentType = 'image/png';
 newItem.save();
});

// app.post('/post', upload.single('avatar'), function (req, res, next) {
//   // req.file is the `avatar` file
//   // req.body will hold the text fields, if there were any
// })

;

app.listen(4000, function() {
  console.log("Server started on port 3000");
});
