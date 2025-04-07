if(process.env.NODE_ENV != "production"){
require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const wrapAsync =require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema,reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const listings= require("./routes/listings.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash= require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const user= require("./routes/user.js");
const {isLoggedIn , isReviewAuthor} = require("./middleware.js");

const dbUrl= process.env.ATLASDB_URL;




main()
.then(()=> {
    console.log("connected to db");
})
.catch((err) =>{ 
    console.log(err);
});

async function main() {
await mongoose.connect(dbUrl);
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({ extended:true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
     secret:process.env.SECRET,
    },
    touchAfter: 24 *3600,
   })
   store.on("error" ,()=>{
    console.log("ERROR in MONGO SESSION STORE" , err);
   });

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized :true,
    cookie:{
        expires:Date.now() +7 *24 *60 * 60* 1000,
        maxAge: 7 *24 *60 * 60* 1000,
        httpOnly: true,
    },
};
  


app.use(session(sessionOptions));
app.use(flash());

// passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

const validateReview = (req,res,next) =>{
    let { error } = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }

};
app.get("/", (req, res) => {
    res.redirect("/listings");
  });

app.use("/" , user);
app.use("/listings" , listings);

// reviews
// post route
app.post("/listings/:id/reviews",isLoggedIn,validateReview,wrapAsync( async(req,res) =>{
   let listing= await Listing.findById(req.params.id);
   let newReview = new Review(req.body.review);
   newReview.author = req.user._id;
   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();
   req.flash("success", "Review added")
   res.redirect(`/listings/${listing._id}`);
})
);
// delete review route
app.delete("/listings/:id/reviews/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(async(req,res)=>{
    let { id, reviewId }=req.params;
    await Listing.findByIdAndUpdate(id , {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted")
    res.redirect(`/listings/${id}`);
})
);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
});


app.listen(8080, () =>{
    console.log("server is running on port 8080");
});