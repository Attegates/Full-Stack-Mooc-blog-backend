const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.map(b => b.likes).reduce((prev, next) => prev + next, 0)
}

// find the blog with most votes. does not care if multiple blogs have the same amount of likes 
const favoriteBlogs = (blogs) => {
  if (blogs.length < 1) {
    return null
  }

  return blogs.reduce((prev, current) => {
    return (prev.likes > current.likes) ? prev : current
  })
}


// find the author who has writtes most blogs. return {author: name, blogs: amountOfBlogs}
const mostBlogs = (blogs) => {

  if (blogs.length < 1) {
    return null
  }

  /* first attempt (works)
  // create an object that contains {author: [blogs], ...}
  const blogsByAuthor = _.groupBy(blogs, 'author')
  // amount of blogs is simply the length of each list in blogsByAuthor  
  let mostAmountOfBlogs = 0
  let authorOfMost
  _.forEach(blogsByAuthor, (value, key) => {
    if (mostAmountOfBlogs < blogsByAuthor[key].length) {
      mostAmountOfBlogs = blogsByAuthor[key].length
      authorOfMost = key
    }
  })

  return {
    author: authorOfMost,
    blogs: mostAmountOfBlogs
  }
  */

  // a simpler version :) (or at least shorter)
  const amountsByAuthor = _.countBy(blogs, 'author')
  const maxKey = _.max(Object.keys(amountsByAuthor), o => obj[o])
  return {
    author: maxKey,
    blogs: amountsByAuthor[maxKey]
  }

}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlogs,
  mostBlogs
}