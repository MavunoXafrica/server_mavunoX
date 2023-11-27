const express = require("express");
const User = require("../models/user");

const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {sendPasswordReset} = require("../utils/nodemailer");

/**
 * endpoint for user to signup(send otp stage)
 * @param phone_no  (string) must be in +234 format
 */
router.post("/signup", async (req, res) => {
  const { email, password, country, state, confirm_password, fullname, city } = req.body;

  // check for required fields
  if (!email || !password || !country || !confirm_password || !fullname || !city || !state) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });

  try {
    // check for duplicate email
    let found = await User.findOne({ email, is_deleted: false }).lean();
    if (found) 
      return res.status(400).send({status: "error", msg: "an account with this email already exists"});

    // check if password matches
    if(password !== confirm_password)
      return res.status(400).send({status: "error", msg: "password missmatch"});

    // create and save user document
    let user = new User;
    user.email = email;
    user.password = await bcrypt.hash(password, 10);
    user.fullname = fullname;
    user.country = country;
    user.city = city;
    user.state = state;
    user.timestamp = Date.now();
    user.img_url = "";
    user.img_id = "";

    await user.save();

    return res.status(200).send({ status: "ok", msg: "success", user});
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", error: e.message });
  }
});

// endpoint to login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // check for required fields
  if (!email || !password) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
  

  try {
    //check if user exists
    const user = await User.findOneAndUpdate({ email }, {is_online: true, last_login: Date.now()}, {new: true}).lean();

    if (!user) 
      return res.status(404).send({status: "error", msg: 'user not found'});

    if(await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          _id: user._id,
          email: user.email
        },
        process.env.JWT_SECRET
      );
  
      return res.status(200).send({ status: "ok", msg: "success", user, token });
    }
    return res.status(400).send({status: "error", msg: "incorrect password"});
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});


// endpoint to logout
router.post("/logout", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // update user document
    await User.updateOne({ _id: user._id }, {is_online: false, last_logout: Date.now()}).lean();
    
    return res.status(200).send({status: "ok", msg: "success"});
  } catch (e) {
    console.error(e);
    // token authentication error
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});


// this endpoint to recover account
router.post("/forgot_password", async (req, res) => {
  const { email } = req.body;

  // check for required fields
  if (!email) 
    return res.status(400).send({ status: "error", msg: "All fields must be entered" });
  
  try {
    // check if the user exists
    const found = await User.findOne({ email }, { email: 1, fullname: 1 }).lean();
  
    if (!found)
     return res.status(400).send({status: "error", msg: "There is no user account with this email"});
    
    const timestamp = Date.now();
    const resetPasswordCode = jwt.sign(
      { email, timestamp },
      process.env.JWT_SECRET,
      {expiresIn: '10m'} // this token will expire in 10 minutes
    );
  
    //send email to user to reset password
    try {
      await sendPasswordReset(email, found.fullname, resetPasswordCode);
      return res.status(200).json({ status: 'ok', msg: 'Password reset email sent, please check your email' });
    } catch (error) {
        return res.status(500).json({ status: 'error', msg: 'Email not sent', error: error.name });
    }
  } catch(e) {
    console.error(e);
    return res.status(500).send({status: "error", msg: "some error occured", error: e.name});
  }
});

// endpoint to recover account webpage
router.get("/reset_password_page/:resetPasswordCode", async (req, res) => {
  const resetPasswordCode = req.params.resetPasswordCode;
  try {
    const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);

    return res.send(`<!DOCTYPE html>
    <html>
        <head>
            <title>Recover Account</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">    
            <style>
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    margin-top: 10%;
                }
                form{
            width: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 26%;
            margin-top: 0%;
        }
            @media screen and (max-width: 900px) {
                form{
            width: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
                }
            

            }
                input[type=text]
            {
                    width: 100%;
                    padding: 12px 20px;
                    margin: 8px 0;
                    display: inline-block;
                    border: 1px solid #ccc;
                    box-sizing: border-box;
                }

                button {
                    background-color: #04AA6D;
                    color: white;
                    padding: 14px 20px;
                    margin: 8px 0;
                    border: none;
                    cursor: pointer;
                    width: 100%;
                }

                button:hover {
                    opacity: 0.8;
                }   

                .container {
                    padding: 16px;
                }

                span.psw {
                    float: right;
                    padding-top: 16px;
                }

                /* Change styles for span and cancel button on extra small screens */
                @media screen and (max-width: 300px) {
                    span.psw {
                        display: block;
                        float: none;
                    }

                    .cancelbtn {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>    
                <h2 style="display: flex; align-items: center; justify-content: center; margin-bottom: 0;">Reset Password</h2>
                <h6 style="display: flex; align-items: center; justify-content: center; font-weight: 400;">Enter the new password
                    you want to use in your account</h6>    
        
            <form action="https://mavunox-to42.onrender.com/auth/reset_password" method="POST">
                <div class="imgcontainer">
                </div>
                <div class="container">
                    <input type="text" placeholder="Enter password" name="password" required style="border-radius: 5px;" minlength="5">
                    <input type='text' placeholder="nil" name='resetPasswordCode' value=${resetPasswordCode} style="visibility: hidden"><br>
                    <button type="submit" style="border-radius: 5px; background-color: #1a73e9;">Submit</button>            
                </div>        
            </form>
        </body>

    </html>`);
  } catch (e) {
      if (e.name === 'JsonWebTokenError') {
        // Handle general JWT errors
        console.error('JWT verification error:', e.message);
        return res.status(401).send(`</div>
        <h1>Password Reset</h1>
        <p>Token verification failed</p>
        </div>`);
      } else if (e.name === 'TokenExpiredError') {
        // Handle token expiration
        console.error('Token has expired at:', e.expiredAt);
        return res.status(401).send(`</div>
        <h1>Password Reset</h1>
        <p>Token expired</p>
        </div>`);
      } 
    console.log(e);
    return res.status(200).send(`</div>
    <h1>Password Reset</h1>
    <p>An error occured!!! ${e}</p>
    </div>`);
  }
});

// endpoint to reset password
router.post("/reset_password", async (req, res) => {
  const { password, resetPasswordCode } = req.body;

  if (!password || !resetPasswordCode) {
    return res
      .status(400)
      .json({ status: "error", msg: "All fields must be entered" });
  }

  try {
    const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);

    const nPassword = await bcrypt.hash(password, 10);

    // update the phone_no field
    await User.updateOne(
      { email: data.email },
      {
        $set: { password: nPassword },
      }
    );

    // return a response which is a web page
    return res.status(200).send(`</div>
    <h1>Recover Account</h1>
    <p>Your password has been changed successfully!!!</p>
    <p>You can now login with your new password.</p>
    </div>`);
  } catch (e) {
      if (e.name === 'JsonWebTokenError') {
        // Handle general JWT errors
        console.error('JWT verification error:', e.message);
        return res.status(401).send(`</div>
        <h1>Password Reset</h1>
        <p>Token verification failed</p>
        </div>`);
      } else if (e.name === 'TokenExpiredError') {
        // Handle token expiration
        console.error('Token has expired at:', e.expiredAt);
        return res.status(401).send(`</div>
        <h1>Password Reset</h1>
        <p>Token expired</p>
        </div>`);
      } 
    console.log("error", e);
    return res.status(200).send(`</div>
    <h1>Recover Account</h1>
    <p>An error occured!!! ${e}</p>
    </div>`);
  }
});

module.exports = router;