function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: "Thinkful",
            url: "https://www.thinkful.com",
            description: "Think outside the classroom",
            rating: 5
        },
        {
            id: 2,
            title: "Thinkful",
            url: "https://www.thinkful.com",
            description: "Think outside the classroom",
            rating: 4
        },
        {
            id: 3,
            title: "Thinkful",
            url: "https://www.thinkful.com",
            description: "Think outside the classroom",
            rating: 5
        },
        {
            id: 4,
            title: "Thinkful",
            url: "https://www.thinkful.com",
            description: "Think outside the classroom",
            rating: 5
        }
    ]
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 4,
        title: "Thinkful",
        url: "https://www.thinkful.com",
        description: "Think outside the classroom",
        rating: 5
       }
    const expectedBookmark = {
      ...maliciousBookmark
    }
    return {
        maliciousBookmark,
      expectedBookmark,
    }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}