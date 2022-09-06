const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const app = express();
let port = 3000;
const morgan = require("morgan");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));
const dotenv = require("dotenv");
dotenv.config();
const dbURL = process.env.db;
mongoose
  .connect(dbURL,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) => {
    app.listen(port, () => {
      console.log("mongoDB Bağlantı kuruldu");
    });
  })
  .catch((err) => console.log(err));
app.use(bodyParser.json()).use(
  bodyParser.urlencoded({
    extended: true,
  })
);
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/data");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});
const upload = multer({ storage: storage });
let User = require("./models/user.js");
const Photo = require("./models/photo.js");
app.get("/", async function (req, res) {
  let id = req.params.id;
  User.findById(id).then((result) => {
    if (result) {
      res.redirect("/login");
    } else {
      res.render(`${__dirname}/src/register/register.ejs`);
    }
  });
});
app.get("/register", async function (req, res) {
  res.render(`${__dirname}/src/register/register.ejs`);
});
app.get("/login", async function (req, res) {
  res.render(`${__dirname}/src/register/login.ejs`);
});
app.post(
  "/register",
  upload.single("uploaded_file"),
  async function (req, res) {
    User.findOne(
      { username: req.body.username, password: req.body.password },
      (user, err) => {
        if (user) {
          res.send("Böyle Bir Kullanıcı Zaten Bulunuyordu");
        } else {
          let user = new User({
            username: req.body.username,
            password: req.body.password,
            userAvatar: req.file.filename,
          });
          user.save().then((result) => {
            res.redirect(`/user/${result._id}`);
            res.cookie("id", result._id);
          });
        }
      }
    );
  }
);
app.post("/login", async function (req, res) {
  User.findOne({
    username: req.body.username,
    password: req.body.password,
  }).then((result) => {
    if (result) {
      if (req.cookies.id) {
        res.redirect(`/user/${result._id}`);
      } else {
        res.cookie("id", result._id);
        res.redirect(`/user/${result._id}`);
      }
    } else {
      res.send(
        `Böyle Bir Kullanıcı Yok Kayıt Bölümüne Gitmek İçin <a href="/register">Tıkla</a>`
      );
    }
  });
});
app.get("/user/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  if (id == userId) {
    User.findOne({ _id: id }).then((result) => {
      Photo.find({ userId: id })
        .sort({ createdAt: -1 })
        .then((photoResult) => {
          res.render(`${__dirname}/src/pages/user-dashboard.ejs`, {
            user: result,
            photo: photoResult,
          });
        });
    });
  } else {
    res.redirect(`/user/${userId}`);
  }
});
app.post("/add-photo/:id", upload.single("uploaded_file"), (req, res) => {
  let userId = req.cookies.id;
  let id = req.params.id;
  if (id == userId) {
    User.findById(id).then((result) => {
      let photo = new Photo({
        title: req.body.title,
        description: req.body.description,
        photo: req.file.filename,
        username: result.username,
        userId: id,
      });
      photo.save().then((result) => {
        res.redirect(`/user/${id}`);
      });
    });
  } else {
    res.redirect(`/user/${userId}`);
  }
});
app.get("/home/:id", (req, res) => {
  let userId = req.cookies.id;
  let id = req.params.id;
  if (id) {
    User.findById(id).then((userResult) => {
      Photo.find()
        .sort()
        .limit(10)
        .then((result) => {
          res.render(`${__dirname}/src/pages/home.ejs`, {
            photo: result,
            user: userResult,
          });
        });
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/settings/:userId", (req, res) => {
  let userId = req.cookies.id;
  if (req.cookies.id == userId) {
    User.findById(userId).then((userResult) => {
      Photo.find({ userId: userId })
        .sort()
        .then((photoResult) => {
          res.render(`${__dirname}/src/pages/settings.ejs`, {
            photo: photoResult,
            user: userResult,
            userId: userId,
          });
        });
    });
  } else {
    res.send("Bu Hesaba Bağlı Değilsiniz");
  }
});
app.post("/settings/:userId", upload.single("uploaded_file"), (req, res) => {
  if (req.cookies.id == req.params.userId) {
    let userId = req.cookies.id;
    User.findByIdAndUpdate(userId, {
      username: req.body.username,
      password: req.body.password,
      userAvatar: req.file.filename,
    }).then((result) => {
      res.redirect(`/settings/${userId}`);
    });
  } else {
    res.send("Bu Hesaba Bağlı Değilsiniz");
  }
});
app.get("/user-profile/:userId", (req, res) => {
  let id = req.params.userId;
  User.findById(id).then((result) => {
    Photo.find({ userId: id }).then((photoResult) => {
      res.render(`${__dirname}/src/pages/user-profile.ejs`, {
        photo: photoResult,
        user: result,
      });
    });
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("id");
  res.redirect("/");
  res.end();
});
