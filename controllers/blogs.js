const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (request, response) => {

  if (!request.body.title || !request.body.url) {
    return response.status(400).end()
  }

  const blog = new Blog({
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes || 0,
  })

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
