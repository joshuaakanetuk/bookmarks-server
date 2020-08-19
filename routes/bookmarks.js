const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("../logger");
const xss = require("xss");
const path = require("path");

const bookmarksRouter = express.Router();
const jsonParser = express.json();
// let bookmarks = require('../store.js')
const BookmarksService = require("../bookmarksservice");

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  url: bookmark.url,
  title: xss(bookmark.title),
  rating: bookmark.rating,
  description: bookmark.description
});

bookmarksRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");

    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    console.log(req.body)
    const { title, url, description, rating } = req.body;
    let newBookmark = { title, url, description, rating };

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    console.log(newBookmark);

    BookmarksService.insertBookmark(req.app.get("db"), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          // .location(`/bookmarks/${bookmark.id}`)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route("/:id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getById(knexInstance, req.params.id)
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(req.app.get("db"), req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    console.log(req.body)
    const { title, url, description, rating } = req.body;
    let newBookmark = { title, url, description, rating };

    console.log(req.body);

    const numberOfValues = Object.values(newBookmark).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'rating' or 'description'`
        }
      });
    }

    BookmarksService.updateBookmark(
      req.app.get("db"),
      req.params.id,
      newBookmark
    )
      .then(numRowsAffected => {
        res.json(serializeBookmark(newBookmark));
      })
      .catch(next);
  });

module.exports = bookmarksRouter;
