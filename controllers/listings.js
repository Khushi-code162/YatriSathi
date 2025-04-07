const Listing = require("../models/listing");



module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "The listing you requested does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createNewListing = async (req, res, next) => {
  // Create a new listing using form data
  const newListing = new Listing(req.body.Listing);
  newListing.owner = req.user._id;

  // Process image upload from Cloudinary via Multer
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }
  
  await newListing.save();
  req.flash("success", "New listing created");
  res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The listing you requested does not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_150,h_150,c_fill");
res.render("listings/edit.ejs", { listing, originalImageUrl });

};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // Prepare update object
  let updateData = {};

  if (req.body.Listing.title) updateData.title = req.body.Listing.title;
  if (req.body.Listing.description) updateData.description = req.body.Listing.description;
  if (req.body.Listing.price) updateData.price = req.body.Listing.price;
  if (req.body.Listing.country) updateData.country = req.body.Listing.country;
  if (req.body.Listing.location) updateData.location = req.body.Listing.location;

  // Update image if a new file is uploaded via Cloudinary
  if (req.file) {
    updateData.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  } else if (
    req.body.Listing.image &&
    req.body.Listing.image.url &&
    req.body.Listing.image.url.trim() !== ""
  ) {
    // Alternatively, update if a new image URL is provided
    updateData.image = { url: req.body.Listing.image.url };
  }

  await Listing.findByIdAndUpdate(id, { $set: updateData });
  req.flash("success", "Listing updated");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
};
