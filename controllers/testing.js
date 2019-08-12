const router = require('express').Router()
const Blog = require('../models/blog')
const Comment = require('../models/comment')
const User = require('../models/user')

router.post('/reset', async (request, response) => {
  await Blog.deleteMany({})
  await Comment.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = router
