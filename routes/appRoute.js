// Require all models
var db = require("./../models");
// var Note = require('./../models/note');
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

  app.get("/api/scrape", function (req, res, next) {
    // First,if we have grabed from http://www.echojs.com/ and saved to DB we have to update
    db.Article.updateMany(
      { "saved": false,"deleted":true },
      { $set: { deleted: false } },
      function (error, doc) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          console.log("*********");
          res.redirect('/');
        }
      });
    // Second, we grab the body of the html with axios
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
            // console.log(dbArticle);
            console.log('new article added');
            // res.send(JSON.stringify(dbArticle));
          })
          .catch(function (err) {
            // If an error occurred, log it
            console.log(err);
          });

      });
      next();
      // Send a message to the client
      // res.send("Success Scraped and Saved to MongoDB!");
    });
  }, function (req, res) {
    res.redirect('/');
  });
   //delete all "saved ==false" articles
  app.get("/api/delete", function (req, res, next) {
    console.log("/api/delete");
    db.Article.updateMany(
      { "saved": false },
      { $set: { deleted: true } },
      function (error, doc) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          console.log("*********");
          res.redirect('/');
        }
      });
  });
  //delete all "saved ==true" articles
  app.get("/api/delete/saved", function (req, res, next) {
    db.Article.updateMany(
      { "saved": true },
      { $set: { deleted: true } },
      function (error, doc) {
        if (error) {
          console.log(error);
          res.status(500);
        } else {
          res.redirect('/saved');
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
// add a note to a saved article
app.post('/api/notes/:id', function(req, res) {
  // let newNote = new Note(req.body);
  db.Note.create(req.body,function(err, doc) {
      if (err) {
          console.log(err);
          res.status(500);
      } else {
          db.Article.findOneAndUpdate(
              { _id: req.params.id },
              { $push: { 'notes': doc.id } },
              function(error, newDoc) {
                  if (error) {
                      console.log(error);
                      res.status(500);
                  } else {
                      res.redirect('/saved');
                  }
              }
          );
      }
  });
});
// delete a note from a saved article
app.post('/api/notes/delete/:id', function(req, res) {
  db.Note.findByIdAndRemove(req.params.id, function(err, note) {
      if (err) {
          console.log(err);
          res.status(500);
      } else {
          res.redirect('/saved');
      }
  });
});
  //------------------------

}

