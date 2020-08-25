var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
	name: String,
	image:String,
	description:String
});

var Campground = mongoose.model("Campground",campgroundSchema);

function seedDb(){
	 Campground.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed campgrounds!");
        
      });
}					   
					   
module.exports = seedDb; 					   