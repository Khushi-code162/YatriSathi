const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL ="mongodb://127.0.0.1:27017/yatrisathi";
main()
.then(()=> {
    console.log("connected to db");
})
.catch((err) =>{ 
    console.log(err);
});

async function main() {
  await mongoose.connect(MONGO_URL);
} 

const initDB = async () => {  
    await Listing.deleteMany({});  
    
    const updatedData = initData.data.map((obj) => ({ 
        ...obj, 
        owner: "67efe451d50fad17448f7f5a"
    }));  // Store the modified array
    
    await Listing.insertMany(updatedData);  // Insert the modified array
    console.log("data was initialized");
};


initDB();