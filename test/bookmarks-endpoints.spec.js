const { expect } = require("chai");
const knex = require("knex");
const app = require("../app");
const {
  makeBookmarksArray,
  makeMaliciousBookmark
} = require("./bookmarks.fixtures");

describe("Bookmarks Endpoints", function() {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  context(`Given no bookmarks`, () => {
    it(`responds with 200 and an empty list`, () => {
      return supertest(app)
        .get("/api/bookmarks")
        .expect(200, []);
    });
  });

  context(`Given no bookmarks`, () => {
    it(`responds with 404`, () => {
      const bookmarkId = 123456;
      return supertest(app)
        .get(`/api/bookmarks/${bookmarkId}`)
        .expect(404, { error: { message: `Bookmark doesn't exist` } });
    });
  });

  context("Given there are bookmarks in the database", () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach("insert bookmarks", () => {
      return db.into("bookmarks").insert(testBookmarks);
    });

    it("GET /api/bookmarks responds with 200 and all of the bookmarks", () => {
      return supertest(app)
        .get("/api/bookmarks")
        .expect(200, testBookmarks);
    });

    it("GET /api/bookmarks/:id responds with 200 and the specified bookmark", () => {
      const bookmarkId = 2;
      const expectedBookmark = testBookmarks[bookmarkId - 1];
      return supertest(app)
        .get(`/api/bookmarks/${bookmarkId}`)
        .expect(200, expectedBookmark);
    });
  });

  describe(`POST /api/bookmarks`, () => {
    it(`creates an Bookmark, responding with 201 and the new Bookmark`, function() {
      this.retries(3);
      const newBookmark = {
        title: "Thinkful",
        url: "https://www.thinkful.com",
        description: "Think outside the classroom",
        rating: "5"
      };
      return supertest(app)
        .post("/api/bookmarks")
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.equal(newBookmark.title);
          expect(res.body.url).to.equal(newBookmark.url);
          expect(res.body.description).to.equal(newBookmark.description);
          // expect(res.body.rating).equal(newBookmark.rating);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .expect(res.body)
        );
    });

    const requiredFields = ["title", "url", "description", "rating"];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: "Thinkful",
        url: "https://www.thinkful.com",
        description: "Think outside the classroom",
        rating: "5"
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post("/api/bookmarks")
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });

    it("removes XSS attack content from response", () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.equal(expectedBookmark.title);
          expect(res.body.url).to.equal(expectedBookmark.url);
        });
    });
  });

  describe(`DELETE /api/bookmarks/:bookmarkId`, () => {
    context(`Given no articles`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context("Given there are articles in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 204 and removes the article", () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(
          bookmark => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks`)
              .expect(expectedBookmarks)
          );
      });
    });
  });

  describe.only(`PATCH /api/bookmarks/:article_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 204 and updates the article", () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: "MDN",
          url: "https://developer.mozilla.org",
          description: "The only place to find web documentation",
          rating: 5
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', 'rating' or 'description'`
            }
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: "updated bookmark title"
        };
        const expectedArticle = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: "should not be in GET response"
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedArticle)
          );
      });
    });
  });
});
