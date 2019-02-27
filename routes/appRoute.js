// Require all models
var db = require("./../models");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
module.exports = function (app) {
  // A GET route for scraping the echoJS website
  app.get("/", function (req, res) {
    console.log("-----/---");
    db.Article
      .find({})
      .where('saved').equals(false)
      .where('deleted').equals(false)
      .sort('-date')
      .limit(20)
      .exec(function (error, articles) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          console.log(articles);
          let hbsObj = {
            title: 'MONGO SCRAPER',
            subtitle: 'http://www.echojs.com Edition',
            articles: articles
          };
          res.render('index', hbsObj);
        }
      });
  });
  // saved articles
  app.get('/saved', function (req, res) {
    db.Article
      .find({})
      .where('saved').equals(true)
      .where('deleted').equals(false)
      .populate('notes')
      .sort('-date')
      .exec(function (error, articles) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          console.log(articles);
          let hbsObj = {
            title: 'Saved Articles',
            subtitle: 'You saved Articles',
            articles: articles
          };
          res.render('saved', hbsObj);
        }
      });
  });

  app.get("/api/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.echojs.com/").then(function (response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);

      // Now, we grab every h2 within an article tag, and do the following:
      $("article h2").each(function (i, element) {
        // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
        // console.log("result: ",result);
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function (dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
            // res.send(JSON.stringify(dbArticle));
          })
          .catch(function (err) {
            // If an error occurred, log it
            console.log(err);
          });
      });

      // Send a message to the client
      res.send("Success Scraped and Saved to MongoDB!");
    });
  });
  //delete articles
  app.get("/api/delete", function (req, res) {
    db.Article.Update({
      $set: { deleted: true }
    },
      function (error, doc) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          res.redirect('/');
        }
      });
  });
  // save an article
  app.post('/api/article/save/:id', function (req, res) {
    console.log("req.params.id", req.params.id);
    db.Article.findByIdAndUpdate(req.params.id, {
      $set: { saved: true }
    },
      function (error, doc) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          res.redirect('/');
        }
      });
  });
  //  delete a scraped article
  app.post('/api/article/delete/:id', function (req, res) {
    console.log("req.params.id", req.params.id);
    db.Article.findByIdAndUpdate(req.params.id, {
      $set: { deleted: true }
    },
      function (error, doc) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          res.redirect('/saved');
        }
      });
  });

  //------------------------

}

