const User = require("../models/user.js");
const { saveRedirectUrl } = require("../middleware.js");
const passport= require("passport");

module.exports.signupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to YatriSathi!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};
module.exports.renderLogin = (req,res)=>{
    res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
    req.flash("success", "Welcome to YatriSathi, you are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  };
  

module.exports.logout =  (req,res, next) =>{
    req.logout((err) =>{
        if (err){
        return  next(err);
        }
        req.flash("success" , "you are logged out");
        res.redirect("/listings");
    })
}