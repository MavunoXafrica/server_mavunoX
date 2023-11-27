const express = require("express");
const User = require("../models/user");

const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uploader = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");


// endpoint to change passowrd
router.post("/change_password", async (req, res) => {
  const { token, old_password, new_password, confirm_new_password } = req.body;

  if (!token || !old_password || !new_password  || !confirm_new_password) {
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
  }

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    //check if password is correct
    let Muser = await User.findById({_id: user._id}, {password: 1}).lean();
    if (await bcrypt.compare(old_password, Muser.password)) {
      // check for new password match
      if(new_password !== confirm_new_password)
        return res.status(400).send({status: "error", msg: "password mismatch"});

      // generate hash password
      const hashed_password = await bcrypt.hash(new_password, 10);

      // update user document 
      Muser = await User.findByIdAndUpdate({_id: user._id}, {password: hashed_password}).lean();
      
      return res.status(200).send({status: "ok", msg: "success", user: Muser});
    }
    
    return res.status(400).send({status: "error", msg: "incorrect password", user: Muser});
  } catch (e) {
    console.error(e);
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

// endpoint to edit profile
router.post("/edit_profile", uploader.single("image"), async (req, res) => {
  const { token, fullname, country, email, state, city } = req.body;

  if (!token) {
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
  }

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // check if email already exist
    let found = await User.findOne({email}, {_id: 1}).lean();
    if(found)
      return res.status(400).send({status: "error", msg: "a user with this email already exists"});

    // upload image to cloudinary if any
    let img_url, img_id;
    if(req.file !== undefined) {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'profile-pictures',
            quality: 'auto'}
        );
        img_url = result.secure_url;
        img_id = result.public_id;
    }

    // fetch user document
    let Muser = await User.findById({_id: user._id}, {fullname: 1, country: 1, email: 1, state: 1, city: 1}).lean();

    // update user document
    Muser = await User.findByIdAndUpdate(
      {_id: user._id}, {
        fullname: fullname || Muser.fullname,
        email: email || Muser.email,
        country: country || Muser.country,
        state: state || Muser.state,
        city: city || Muser.city,
        img_url: img_url || Muser.img_url,
        img_id: img_id || Muser.img_id
      }, {new: true}
    ).lean();

    return res.status(200).send({status: "ok", msg: "success", user: Muser});
  } catch (e) {
    console.error(e);
    if (e.name === 'JsonWebTokenError')
        return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

// endpoint to view profile
router.post("/view_profile", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
  }

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // fetch user document
    let Muser = await User.findById({_id: user._id}).lean();

    return res.status(200).send({status: "ok", msg: "success", user: Muser});
  } catch (e) {
    console.error(e);
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

module.exports = router;