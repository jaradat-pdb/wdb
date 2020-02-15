const express = require("express"),
	router = express.Router(),
	Campground = require("../models/campground");

router.get("/", (req, res) => {
	Campground.find({}, function(err, campgrounds) {
		if(err) {
			console.error("Unsuccessful query operation\n" + err);
		}
		else {
			console.log("Successful query operation, " + campgrounds.length + " campgrounds returned");
			res.render("campgrounds/index", {campgrounds: campgrounds});
		}
	});
});

router.post("/", isLoggedIn, (req, res) => {
	Campground.create({
		name: req.body.name,
		image: req.body.image,
		desc: req.body.desc,
		author: {
			id: req.user._id,
			username: req.user.username
		}
	}, function(err, campground) {
		if(err) {
			console.error("Unsuccessful save operation\n" + err);
		}
		else {
			console.log("Successful save operation:\n" + campground);
		}
	});
	res.redirect("/campgrounds");
});

router.get("/new", isLoggedIn, (req, res) => {
	res.render("campgrounds/new");
});

router.get("/:id", (req, res) => {
	Campground.findById(req.params.id).populate("comments").exec((err, campground) => {
		if(err) {
			console.error("Unsuccessful query operation\n" + err);
		}
		else {
			console.log("Successful query operation, " + campground.name + " returned");
			res.render("campgrounds/show", {campground: campground});
		}
	});
});

router.get("/:id/edit", isAuthorized, (req, res) => {
	Campground.findById(req.params.id, (err, campground) => {
		res.render("campgrounds/edit", {campground: campground});
	});
});

router.put("/:id", isAuthorized, (req, res) => {
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, campground) => {
		if(err) {
			console.error("Unsuccessful update operation(s)\n" + err);
			res.redirect("back");
		}
		else {
			res.redirect("/campgrounds/" + campground._id);
		}
	});
});

router.delete("/:id", isAuthorized, (req, res) => {
	Campground.findByIdAndRemove(req.params.id, (err) => {
		if(err) {
			console.error("Unsuccessful delete operation(s)\n" + err);
			res.redirect("back");
		}
		res.redirect("/campgrounds");
	});
});

function isAuthorized(req, res, next) {
	if(req.isAuthenticated()) {
		Campground.findById(req.params.id, (err, campground) => {
			if(err) {
				console.error("Unsuccessful query operation using [" + req.params.id + "], see below for more info:\n" + err);
				res.redirect("back");
			}
			else {
				console.log("Successful query operation using [" + req.params.id + "], retrieved campground [" + campground.name + "]");
				if(campground.author.username === "Admin" || ((campground.author.id) && campground.author.id.equals(req.user._id))) {
					next();
				}
				else {
					console.error("Unauthorized request, user is not authorized to access this page/link/action");
					res.redirect("back");
				}
			}
		});
	}
	else {
		console.error("Unauthenticated request, request must originate from an authenticated user");
		res.redirect("/login");
	}
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
};

module.exports = router;