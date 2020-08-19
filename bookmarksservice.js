const BookmarksService = {
    //getAllArticles
    getAllBookmarks(knex) {
      return knex.select("*").from("bookmarks");
    },
    //insertArticle, newArticle
    insertBookmark(knex, newBookmark) {
      return knex
        .insert(newBookmark)
        .into("bookmarks")
        .returning("*")
        .then(rows => {
          return rows[0];
        });
    },
    getById(knex, id) {
      return knex
        .from("bookmarks")
        .select("*")
        .where("id", id)
        .first();
    },
    //deleteArticle
    deleteBookmark(knex, id) {
      return knex("bookmarks")
        .where({ id })
        .delete();
    },
    //updateArticle, newArticleFields
    updateBookmark(knex, id, newBookmarkInfo) {
      return knex("bookmarks")
        .where({ id })
        .update(newBookmarkInfo);
    }
  };
  
  module.exports = BookmarksService;
  