const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const Comment = require('../models/comment')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (request, response, next) => {

  if (!request.body.title || !request.body.url) {
    return response.status(400).end()
  }

  const token = request.token  // middleware extracts the token into the request

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: request.body.title,
      author: request.body.author,
      url: request.body.url,
      likes: request.body.likes || 0,
      user: user._id
    })

    savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(200).json(savedBlog.toJSON())
  } catch (exception) {
    next(exception)
  }

})

blogsRouter.delete('/:id', async (request, response, next) => {

  const token = request.token

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    // only the user who added the blog may delete the blog
    const blog = await Blog.findById(request.params.id)
    if (blog) {  // blog must exist to find the user
      if (blog.user.toString() !== decodedToken.id) {
        return response.status(403).json({ error: 'only the user who added the blog may delete the blog' })
      }
    }

    await Blog.findByIdAndRemove(request.params.id)
    if (blog) {  // if blog exists also remove it from the user
      const user = await User.findById(decodedToken.id)
      const newBlogs = user.blogs.filter(blogId => {
        return blogId.toString() !== blog.id.toString()
      })
      user.blogs = newBlogs
      await user.save()
    }
    response.status(204).end()

  } catch (exception) {
    next(exception)
  }

})

blogsRouter.put('/:id', async (request, response) => {
  const blog = {
    likes: request.body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true }).populate('user', { username: 1, name: 1 })
  console.log(updatedBlog)
  console.log(updatedBlog.toJSON())
  response.json(updatedBlog.toJSON())

})

blogsRouter.post('/:id/comments', async (request, response) => {

  try {
    const commentContent = request.body.content
    console.log(commentContent)
    const blog = await Blog.findById(request.params.id)
    console.log(blog)
    const newComment = new Comment({
      // perhaps could just use the param :id?
      blog: blog._id,
      content: commentContent,
    })

    savedComment = await newComment.save()
    console.log(savedComment.toJSON())
    response.status(200).json(savedComment.toJSON())
  } catch (exception) {
    console.error(exception)
  }

})

blogsRouter.get('/:id/comments', async (request, response, next) => {
  // get all comments for specidief blog id
  try {
    const comments = await Comment.find({ blog: request.params.id })
    response.json(comments.map(c => c.toJSON()))
  } catch (exception) {
    console.error(exception)
    next(exception)
  }
})

blogsRouter.get('/comments', async (request, response, next) => {
  try {
    const comments = await Comment.find({})
    response.json(comments.map(c => c.toJSON()))
  } catch (exception) {
    next(exception)
  }
})

module.exports = blogsRouter
