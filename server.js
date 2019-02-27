var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");



var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
// Handlebars
app.engine(
      "handlebars",
      exphbs({
            defaultLayout: "main"
      })
);
app.set("view engine", "handlebars");
/**
 * If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
process.env.MONGODB_URI=mongolab-silhouetted-75746
*/
//eg: mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/myScraper";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
//routes====
require("./routes/appRoute")(app);
// Start the server
app.listen(PORT, function () {
      console.log("App running on port " + PORT + "!");
});