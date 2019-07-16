const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.map(b => b.likes).reduce((prev, next) => prev + next, 0)
}

// find the blog with most votes. does not care if multiple blogs have the same amount of likes 
const favoriteBlogs = (blogs) => {
  if (blogs.length > 0) {
    return blogs.reduce((prev, current) => {
      return (prev.likes > current.likes) ? prev : current
    })
  }
  return null
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlogs
}