const mongoose = require('mongoose')
const supertest = require('supertest')
const Blog = require('../models/blog')
const helper = require('./blog_api_test_helper')
const app = require('../app')

const api = supertest(app)

const API_BASE_URL = '/api/blogs'

describe('when there is initial blogs saved', () => {



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

  test('returned blogs have identifier field defined and it is defined as "id"', async () => {
    const blogs = await helper.blogsInDb()

    blogs.forEach(blog => {
      expect(blog.id).toBeDefined()
    })

  })


  describe('adding a blog', () => {


    test('a valid blog can be added', async () => {
      const newBlog = {
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
        likes: 14,
      }

      await api
        .post(API_BASE_URL)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

      expect(blogsAtEnd).toContainEqual({
        id: expect.any(String),
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
        likes: 14,
      })

    })

    test('likes default to 0 when a blog that does not define likes is added', async () => {
      const newBlog = {
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
      }

      await api
        .post(API_BASE_URL)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toContainEqual({
        id: expect.any(String),
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
        likes: 0,
      })

    })

    test('when blog does not define fields "title" or "url" it is not added and response status is 400', async () => {
      let newBlog = {
        author: "Atte Gates",
        likes: 14
      }

      await api
        .post(API_BASE_URL)
        .send(newBlog)
        .expect(400)

      newBlog = {
        author: "Atte Gates",
        likes: 14,
        title: "BLACK METAL IST KRIEG"
      }

      await api
        .post(API_BASE_URL)
        .send(newBlog)
        .expect(400)

      newBlog = {
        author: "Atte Gates",
        likes: 14,
        url: "666"
      }

      await api
        .post(API_BASE_URL)
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('deleting a blog', () => {
    test('existing blog is deleted and returns 204', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`${API_BASE_URL}/${blogToDelete.id}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length - 1)

      const ids = blogsAtEnd.map(blog => blog.id)

      expect(ids).not.toContain(blogToDelete.id)

    })
    test('DELETE to non existing id does not remove anything and returns 204', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const nonExistingId = await helper.nonExistingId()

      await api
        .delete(`${API_BASE_URL}/${nonExistingId}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('updating a blog', () => {
    test('updating likes field of a blog returns blog with updated likes and amount of blogs does not change', async () => {
      const blogsAtStart = await helper.blogsInDb()

      let blogToUpdate = blogsAtStart[0]
      const likesAtStart = blogToUpdate.likes
      const newLikes = likesAtStart + 1
      blogToUpdate.likes = newLikes

      const response = await api
        .put(`${API_BASE_URL}/${blogToUpdate.id}`)
        .send(blogToUpdate)
        .expect(200)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)

      expect(response.body).toEqual(blogToUpdate)

    })

    test.skip('PUT to non existing id does ??', async () => {
      const nonExistingId = await helper.nonExistingId()

      // what should it do?

    })
  })

})

afterAll(() => {
  mongoose.connection.close()
})