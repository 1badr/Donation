const User = require('../models/UserModel');
const { isEmail } = require('validator');
const jwt = require('jsonwebtoken');


const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '', name: '' };

  if (err.code === 'incorrect email') {
    errors.email = 'This email is not registered';
  }

  if (err.code === 'incorrect password') {
    errors.password = 'This password is incorrect';
  }

  if (err.code === 11000) {
    errors.email = 'This email is already in use';
    return errors;
  }

  if (err.message.includes('user validation failed')) {
    if (err.errors) {
      Object.values(err.errors).forEach(({ properties }) => {
        errors[properties.path] = properties.message;
      });
    }
    return errors;
  }

  return errors; 
};


const maxAge = 3*24*60*60 // in secondes , cookie in millie seconds
const createToken =(id) =>{
    return jwt.sign({id},'badrIsLegend',{
    expiresIn:maxAge
    });
}


const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"), 
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1000000 * 100 }, 
}).single("image"); 
const signup_post = (req, res) => {
    upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "حدث خطأ أثناء تحميل الصورة" });
    }

    try {
      const {
        email,
        password,
        username,
        type,
        profilePicture,
      } = req.body;

      let image = ""; 

      if (req.file) {
        image = req.file.filename; 
      }
      const user = await User.create({
        email,
        password,
        username,
        profilePicture,
        type,
        
      });

      const token = createToken(user._id);
      res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.status(201).json({ type: user.type, id: user._id });
    } catch (err) {
      let error = handleErrors(err);
      res.status(400).json({ error });
    }
  });
};

const login_post = async (req, res) => {
    const { email, password } = req.body;
  
  try {
    const user = await User.login(email, password);
    const userType = user.type;
    const userId = user._id;
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ type: user.type, id: user._id, name: user.name });
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ error });
  }
};


const logout_get = (req,res)=>{
    res.cookie('jwt','',{maxAge:1});
    return res.json();

}




module.exports = {
    signup_post,
    login_post,
    logout_get,
  };