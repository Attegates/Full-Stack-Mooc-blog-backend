const mongoose = require('mongoose')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./blog_api_test_helper')
const app = require('../app')

const api = supertest(app)

const API_BLOGS_URL = '/api/blogs'
const API_USERS_URL = '/api/users'
const API_LOGIN_URL = '/api/login'

let token  // bearer token for authorization
let decodedToken  // to get the id of the authorized user

// create a user, login and the save the bearer token
beforeAll(async () => {
  await User.deleteMany({})
  const newUser = {
    username: '73571',
    name: 'Testi Tester',
    password: 'salasana'
  }
  // save by using the api because the api handles hashing the password
  // saving straight to the db does not create a passwordHash
  //await newUser.save()
  await api
    .post(API_USERS_URL)
    .send(newUser)

  const userToLogin = {
    username: newUser.username,
    password: newUser.password
  }

  const response = await api
    .post(API_LOGIN_URL)
    .send(userToLogin)


  token = response.body.token
  decodedToken = jwt.verify(token, process.env.SECRET)
})

describe('when there is initial blogs saved', () => {



  beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))

    // save blogs through the api so user is automatically added
    // saving straight to the db does not define a user who added the blog to the blog entry.    
    /*
    const promiseArray = blogObjects.map(blog => {
      return api
        .post(API_BLOGS_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(blog)
    })
    */
    //await Promise.all(promiseArray)

    // do this sequently. await Promise.all(...) version does things concurrently and messes up the blogs[] field of the user.
    // since mongodb does not guarantee the data to be up to date this might not be a good way to do this ??? but it seems to work for now.
    for (let i = 0; i < blogObjects.length; i++) {
      let result = await api
        .post(API_BLOGS_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(blogObjects[i])
    }
  })

  test('all blogs are returned', async () => {
    const response = await api.get(API_BLOGS_URL)
    expect(response.body.length).toBe(helper.initialBlogs.length)
  })

  test('returned blogs have identifier field defined and it is defined as "id"', async () => {
    const blogs = await helper.blogsInDb()

    blogs.forEach(blog => {
      expect(blog.id).toBeDefined()
    })

  })


  describe('adding a blog', () => {

    test('a valid blog can be added when request contains valid auth token', async () => {
      const newBlog = {
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
        likes: 14,
      }

      const response = await api
        .post(API_BLOGS_URL)
        .set('Authorization', `Bearer ${token}`)
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
        user: mongoose.Types.ObjectId(decodedToken.id)  // should be the id of the user who added the entry NOTE! in Object form and decodedToken.id is in String form so cast it into mongoose ObjectId
      })

    })

    test('a blog cannot be added when request contains no auth token', async () => {
      const newBlog = {
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
        likes: 14,
      }

      await api
        .post(API_BLOGS_URL)
        .send(newBlog)
        .expect(401)
      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)

    })

    test('a blog cannot be added when request contains invalid auth token', async () => {
      const newBlog = {
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
        likes: 14,
      }

      const invalidToken = token.substring(1)  // cut off one character from the valid token to make it invalid

      await api
        .post(API_BLOGS_URL)
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(newBlog)
        .expect(401)
      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)

    })

    test('likes default to 0 when a blog that does not define likes is added', async () => {
      const newBlog = {
        title: "BLACK METAL IST KRIEG",
        author: "Atte Gates",
        url: "666",
      }

      await api
        .post(API_BLOGS_URL)
        .set('Authorization', `Bearer ${token}`)
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
        user: mongoose.Types.ObjectId(decodedToken.id)
      })

    })

    test('when blog does not define fields "title" or "url" it is not added and response status is 400', async () => {
      let newBlog = {
        author: "Atte Gates",
        likes: 14
      }

      await api
        .post(API_BLOGS_URL)
        .send(newBlog)
        .expect(400)

      newBlog = {
        author: "Atte Gates",
        likes: 14,
        title: "BLACK METAL IST KRIEG"
      }

      await api
        .post(API_BLOGS_URL)
        .send(newBlog)
        .expect(400)

      newBlog = {
        author: "Atte Gates",
        likes: 14,
        url: "666"
      }

      await api
        .post(API_BLOGS_URL)
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('deleting a blog', () => {
    test('existing blog is deleted and returns 204 when authorized user deletes their own entry', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`${API_BLOGS_URL}/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length - 1)

      const ids = blogsAtEnd.map(blog => blog.id)

      expect(ids).not.toContain(blogToDelete.id)

    })
    test('DELETE to non existing id does not remove anything and returns 204 when authorized user tries to delete an entry', async () => {
      const blogsAtStart = await helper.blogsInDb()

      const nonExistingId = await helper.nonExistingId()

      await api
        .delete(`${API_BLOGS_URL}/${nonExistingId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })

    test('cannot delete blog entry with invalid token', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`${API_BLOGS_URL}/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token.substring(1)}`)
        .expect(401)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })

    test('cannot delete another users blog entry', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      // create a new user and login
      const user = {
        username: 'persephone',
        name: 'Persephone',
        password: 'salasana'
      }
      await api
        .post(API_USERS_URL)
        .send(user)
    
      const login = {
        username: user.username,
        password: user.password
      }
    
      const response = await api
        .post(API_LOGIN_URL)
        .send(login)
    
    
      const testToken = response.body.token
      
      await api
        .delete(`${API_BLOGS_URL}/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403)

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
        .put(`${API_BLOGS_URL}/${blogToUpdate.id}`)
        .send(blogToUpdate)
        .expect(200)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)

      expect(blogsAtEnd).toContainEqual({
        id: blogToUpdate.id,
        title: blogToUpdate.title,
        author: blogToUpdate.author,
        url: blogToUpdate.url,
        likes: newLikes,
        user: expect.any(Object)
      })


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