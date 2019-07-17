const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body)

  savedBlog = await blog.save()
  response.status(200).json(savedBlog)
  /*
  blog
    .save()
    .then(result => {
      response.status(200).json(result)
    })
    */
})

module.exports = blogsRouter
