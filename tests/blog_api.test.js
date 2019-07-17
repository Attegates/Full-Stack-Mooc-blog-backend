const mongoose = require('mongoose')
const supertest = require('supertest')
const Blog = require('../models/blog')
const helper = require('./blog_api_test_helper')
const app = require('../app')

const api = supertest(app)

const API_BASE_URL = '/api/blogs'

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))

  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)

})

test('all blogs are returned', async () => {
  const response = await api.get(API_BASE_URL)

  expect(response.body.length).toBe(helper.initialBlogs.length)
})


afterAll(() => {
  mongoose.connection.close()
})