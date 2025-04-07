const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });


const listingController = require("../controllers/listings.js");
 

// index route
router.get("/", wrapAsync(listingController.index));

// new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.get("/category/:category", wrapAsync(async (req, res) => {
  const { category } = req.params;
  const listings = await Listing.find({ category: category });
  res.render("listings/index", { allListings: listings, category });
}));

router.get("/search", wrapAsync(async (req, res) => {
  const { q } = req.query;

  const listings = await Listing.find({
    $or: [
      { country: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } }
    ]
  });

  res.render("listings/index", { allListings: listings, category: `Results for "${q}"` });

}));

// show route
// router.get("/:id", wrapAsync(listingController.showListing));
router.get("/:id", wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  // Validate the ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid listing ID.");
    return res.redirect("/listings");
  }

  return listingController.showListing(req, res, next);
}));


// create route
router.post(
  "/",
  isLoggedIn,
  upload.single("listing[image]"),
  wrapAsync(listingController.createNewListing));


// Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.editListing)
);

// update Route
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.single("Listing[image]"),
  wrapAsync(listingController.updateListing)
);

// delete route
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;
