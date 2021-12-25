//jshint esversion:6
require('dotenv').config()
const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
const multer = require('multer');
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require ('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const profileContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

// const { each } = require('lodash');
// const { urlencoded } = require('body-parser');
// const { request } = require('express');

//define storage for images
// const storage = multer.diskStorage({
//   destination:function(request,file,callback){
//     callback(null, './public/images')
//   },
// //addback the extension
//   filename:function(request , file, calltime){
//     callback(null, Date.now() + file.originalname)
//   },
// });
//   //upload parameter for multer
//   const uploadimg = multer({
//     storage: storage,
//     limits:{
//       fieldSize: 1024*1024*3,
//     }
//   });
//   module.exports = uploadimg

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: process.env.CLIENT_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


var uri = process.env.MONGO_URL;
const options = {
  useNewUrlParser: true,
  };
 mongoose.connect(uri, options);
//mongoose.set("useCreateIndex", true);

// MongoClient.connect(uri, function(err, client) {
//   const collection = client.blogDB("blogDB").collection("posts,users");
//   // perform actions on the collection object
//   client.close();
// });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleID:String
});

//const secret =  "secret";
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
  callbackURL: "http://localhost:3000/auth/google/success",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

const postSchema = {
  title: String,
  content: String,
  // photo:{
  //   data: Buffer,
  // }
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function (req, res) {

  Post.find({}, function (err, posts) {
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts,
    });
  });
});

app.get("/auth/google",
   passport.authenticate("google", {scope: ["profile"]}) 
);

app.get('/auth/google/success', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/success");
  });

app.get("/profile", function (req, res) {

  Post.find({}, function (err, posts) {
    res.render("profile", {
      profileContent: profileContent,
      posts: posts
    });
  });
});

app.post("/delete", function (req, res) {
  const deletedpostID = req.body.delbutton;

  Post.findByIdAndRemove(deletedpostID, function (err) {
    if (!err) {
      console.log("success");
    }
    res.redirect("/");
  });
})

app.get("/compose", function (req, res) {
  res.render("compose");
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    //img: req.file.image
  });

  post.save(function (err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function (req, res) {

  const requestedPostId = req.params.postId;

  Post.findOne({ _id: requestedPostId }, function (err, post) {
    res.render("post", {
      title: post.title,
      content: post.content,
      img: post.photo
    });
  });
});

app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent });
});

app.get("/login", function (req, res) {
  res.render("login");
})

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
})

app.get("/success", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("success");
  } else {
    res.redirect("/login");
  }
})

app.post("/register", function (req, res) {
  User.register({ username: req.body.username },
    req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/success");
        });
      }
    });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    passport: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/success");
      });
    }
  })
});


// app.get("/success",function(req,res){
//  if(req.isAuthenticate()){
//    res.render("success");
//  }else{
//    res.redirect("/login");
//  }
// });

// app.get("/logout",function(req,res){
//   req.logout();
//   res.redirect("/");
// });

// app.post("/register",function(req,res){

//   User.register({username: req.body.username}, req.body.password, function(err, user){
//     if(err){
//       console.log(err);
//       res.redirect("/register");
//     }else{
//       passport.authenticate("local")(req,res,function(){
//         res.redirect("/success");
//       });
//     }
//   });
//   });

// app.post("/login",function(req,res){
//  const user = new User({
//   username: req.body.username,
//   password: req.body.password
// });

//  req.login(user,function(err){
//    if(err){
//      console.log(err);
//    }
//    else{
//      passport.authenticate("local") (req,res,function(){
//        res.redirect("/success");
//      });
//   }
//  });
// });

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
