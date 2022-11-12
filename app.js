const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/auth');

const app = express();

const JWT_SECRET = "uilfyvas4563677^$%&yufvy^T&YUVH&^vjuvgutcuk^&UVf&^FuVUfo6^vlufO&^foVUvOUIBG78g7O06f7((^&%R&%$e64#W&^5";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const conn = mongoose.connect("mongodb://localhost:27017/theBegetterTownDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // useCreateIndex: true
});


const Profile = require("./models/profile.model");
const ContactUs = require("./models/contactUs.model");
const Post = require("./models/post.model");

const ProfileStorage = multer.diskStorage({
    dest: function (req, file, cb) {
        cb(null, 'profilePictures/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now + file.originalname);
    }
});

const profilepic = multer({
    storage: ProfileStorage
});


app.get("*", checkUser);

app.get("/", async function (req, res) {
    const all = await Post.find({});

    console.log(all);
    res.render("index", allPosts = all);
});

app.get("/login", function (req, res) {
    res.render("login");
});;


app.get("/aboutUs", function (req, res) {
    res.render("aboutUs");
});;

app.get("/signup", function (req, res) {
    res.render("signup");
});

app.get("/events", function (req, res) {
    res.render("events");
});
app.get("/contactUs", function (req, res) {
    res.render("contactUs");
});

app.get("/myprofile", requireAuth, function (req, res) {
    res.render("dashboard");
});



app.get("/add_post", requireAuth, function (req, res) {
    res.render("add_post");
});


app.post("/signup", profilepic.single("profilepicture"), async (req, res) => {
    var TypeOfUser;
    if (req.body.creator == 1) {
        TypeOfUser = "Creator";
    }
    else {
        TypeOfUser = "User";
    }

    const password = await bcrypt.hash(req.body.password, 10);


    try {

        const user = await Profile.create({
            Username: req.body.username,
            Name: req.body.firstname + " " + req.body.lastname,
            Email: req.body.email,
            Password: password,
            Country: req.body.country,
            PhoneNumber: req.body.phonenumber,
            FieldOfInterest: req.body.fieldofinterest,
            TypeOfUser: TypeOfUser,
            BusinessEmail: req.body.businessemail,
            Address: req.body.city + ", " + req.body.state + ", Zip Code: " + req.body.zip,
            Bio: req.body.bio,
            ProfileImg: {
                data: req.file,
                contentType: "image/png"
            }
        });

        const token = jwt.sign(
            {
                id: user._id,
                username: user.Username
            },
            JWT_SECRET
        );

        return res.cookie({ "token": token }).redirect("/login");


        // user.save().then(() => res.send("Successfully Uploaded"));
    } catch (error) {
        if (error.code === 11000) {
            res.send("Please make sure your username, e-mail ID and phone number are unique");
        }
    }

    // catch(error){
    //     res.status(400).send("Error occured");
    // }

    // return res.cookie({"token":token}).redirect("/");
});

app.post("/contactUs", async (req, res) => {

    try{

    const msg = await ContactUs.create({
        Name: req.body.firstname + " " + req.body.lastname,
        Email: req.body.email,
        Message: req.body.message
    });

    // user.save().then(() => res.send("Successfully Uploaded"));
}catch(error){
    res.status(400).send("Error occured");
}

res.redirect("/")
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await Profile.findOne({ Username: username });

    if (user) {

        console.log(user);
        if (bcrypt.compare(password, user.Password)) {
            // the username, password combination is successful

            const token = jwt.sign(
                {
                    id: user._id,
                    username: user.Username
                },
                JWT_SECRET
            )

            res.cookie('jwt', token).redirect("/index")
            // res.render("index.ejs");
        }

        res.send("incorrect password");
    }
    else{
        res.send("incorrect username");
    }
});


app.get("/mypost", requireAuth, async function(req, res) {
    const token = req.cookies.jwt;

    jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err);
            // res.redirect("/login");
        }
        else{
            let user = await Profile.findById(decodedToken.id);
            const all = await Post.find({Username:user.Username});

            // console.log(all);
        
            res.render("mypost",allPosts = all);
        }
    })
  
   
   
});

app.get("/logout", (req, res) => {
    res.cookie('jwt', "", {maxAge: 1});
    res.redirect('/');
});

app.post("/add_post", (req, res) => {
    const token = req.cookies.jwt;

    jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
        if (err) {
            console.log(err);
            res.redirect("/login");
        }
        else {
            let user = await Profile.findById(decodedToken.id);
            console.log("***********************************")
             console.log(user)
             console.log("***********************************")
            const newPost = await Post.create({
                Username: user.Username,
                Title: req.body.title,
                Description: req.body.description,
                Category: user.FieldOfInterest
            });
            
        }
    })

    // console.log(user.Username);

    res.redirect("/");
})

app.listen(3000, function () {
    console.log("Server started on port 3000");
});