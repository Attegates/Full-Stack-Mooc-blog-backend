const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.map(b => b.likes).reduce((prev, next) => prev + next, 0)  
}

module.exports = {
  dummy,
  totalLikes
}