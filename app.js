var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash")
var passport = require("passport");
var passportlocal = require("passport-local");
var methodOverride = require("method-override")
var User = require("./models/user");
var Campground = require("./models/campgrounds");

// seedDb();

mongoose.connect(MONGO_DB_KEY , {
	useNewUrlParser: true
	
}).then(()=>{
	console.log("db connected")
}).catch(err =>{
	console.log("error",err.message)
});
mongoose.set('useFindAndModify', true);
mongoose.set('useFindAndDelete', true);


app.use(express.static(__dirname + "/public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(require("express-session")({
	secret:"blah blah blah love is shit",
	resave:false,
	saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(flash());

passport.use(new passportlocal(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.nowuser = req.user;
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
});


app.get("/",function(req,res){
	res.render("home.ejs");
});

app.get("/campgrounds",function(req,res){
	
	Campground.find({},function(err , allcampgrounds){
		if(err){
			console.log(err)
		}else{
			console.log(allcampgrounds.name)
			res.render("campgrounds.ejs",{campgrounds:allcampgrounds});
		}
		
	})
	
});


app.get("/campgrounds/new",isLoggedin,function(req,res){
	
	res.render("newcamps.ejs", );
	
});

app.post("/campgrounds",function(req,res){
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id:req.user._id,
		username:req.user.username
	}
	var newcamps = ({name: name ,price:price, image: image, description: description , author:author});
	
	Campground.create(newcamps,function(err,newone){
		if(err){
			console.log(err)
		}else{
			
			res.redirect("/campgrounds");
		}
	});
	
	
});

app.get("/campgrounds/:id",isLoggedin,function(req,res){
	
	Campground.findById(req.params.id,function(err , foundCamp){
		if(err){
			console.log(err)
		}else{
			res.render("show.ejs",{campgrounds:foundCamp});
		}
		
	})
	
});

app.get("/campgrounds/:id/edit",owner,function(req,res){
		Campground.findById(req.params.id,function(err,foundCamp){
		if(err){
			console.log(err);
			res.redirect("/campgrounds")
		}
		else{
				res.render("edit.ejs",{campgrounds:foundCamp});
			}
	})
});

app.put("/campgrounds/:id",owner,function(req,res){
	var updata = {
		name:req.body.name,
		price:req.body.price,
		image:req.body.image,
		description:req.body.description
	}
	Campground.findByIdAndUpdate(req.params.id, updata,function(err,updated){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
});

app.delete("/campgrounds/:id",owner,function(req,res){
	Campground.findByIdAndDelete(req.params.id,function(err){
		if(err){
			console.log(err);
			res.redirect("/campgrounds")
		}else{
			res.redirect("/campgrounds");
		}
	})
});

app.get("/register",function(req,res){
	res.render("register.ejs")
})

app.post("/register",function(req,res){
 	var username=req.body.username;
 	var password=req.body.password;
	User.register(new User({username:username}),req.body.password , function(err,user){
		if(err){
			req.flash("error" , err.message);
			console.log(err);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res ,function(){
			req.flash("success" , "Welcome " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

app.get("/login",function(req,res){
	res.render("login.ejs")
});

app.post('/login',passport.authenticate("local",{
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}),function(req,res){
	
});

app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged u out")
	res.redirect("/");
});

function isLoggedin(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You must login")
	res.redirect("/login");
}

function owner(req,res,next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id,function(err,foundCamp){
		if(err){
			console.log(err);
			res.redirect("/campgrounds")
		}else{
			if(foundCamp.author.id.equals(req.user.id)){
				next();
			}else{
				res.redirect("back");
			}
			
		}
	})
	}
}

app.listen(3000,function(){
	console.log("server is good");
});