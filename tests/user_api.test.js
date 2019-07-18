const mongoose = require('mongoose')
const supertest = require('supertest')
const User = require('../models/user')
const helper = require('./user_api_test_helper')
const app = require('../app')
mongoose.set('useCreateIndex', true);

const api = supertest(app)

const API_BASE_URL = '/api/users'

describe('when there is initial users saved', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const userObjects = helper.initialUsers.map(user => new User(user))
    const promiseArray = userObjects.map(user => user.save())
    await Promise.all(promiseArray)
  })

  test('all users are returned', async () => {
    const response = await api.get(API_BASE_URL)
    expect(response.body.length).toBe(helper.initialUsers.length)
  })

  test('returned users have fields id, username and name and NO field for password', async () => {
    const users = await helper.usersInDb()

    users.forEach(user => {
      expect(user.id).toBeDefined()
      expect(user.username).toBeDefined()
      expect(user.name).toBeDefined()
      expect(user.passwordHash).not.toBeDefined()
      expect(user.password).not.toBeDefined()
    })
  })

  describe('creating users', () => {

    test('creating a valid unique user succeeds', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = helper.newUniqueUser

      const result = await api
        .post(API_BASE_URL)
        .send(newUser)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()

      expect(usersAtEnd.length).toBe(usersAtStart.length + 1)
      expect(usersAtEnd).toContainEqual({
        blogs: expect.any(Array),
        id: expect.any(String),
        username: newUser.username,
        name: newUser.name,
      })
    })

    test('creating a non unique user fails with status 400 and returns an error message', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = helper.newNonUniqueUser

      const result = await api
        .post(API_BASE_URL)
        .send(newUser)
        .expect(400)

      const usersAtEnd = await helper.usersInDb()

      expect(usersAtEnd.length).toBe(usersAtStart.length)

      expect(result.body.error).toContain('User validation failed')

    })

    test('creating an user with username shorter than 3 characters fails with status 400 and returns an error message', async () => {
      const usersAtStart = await helper.usersInDb()

      // username must be longer than 3 characters
      const newUser = {
        username: 'aa',
        password: 'salasana'
      }

      const result = await api
        .post(API_BASE_URL)
        .send(newUser)
        .expect(400)


      const usersAtEnd = await helper.usersInDb()

      expect(usersAtEnd.length).toBe(usersAtStart.length)

      expect(result.body.error).toContain('User validation failed')

    })

    test('creating an user with no password fails with status 400 and returns an error message', async () => {
      const usersAtStart = await helper.usersInDb()

      newUser = {
        username: 'this is long enough',
        name: 'abcdefg'
        //password missing
      }

      const result = await api
        .post(API_BASE_URL)
        .send(newUser)
        .expect(400)

      const usersAtEnd = await helper.usersInDb()

      expect(usersAtEnd.length).toBe(usersAtStart.length)

      expect(result.body.error).toContain('username', 'password', 'required')

    })

    test('creating an user with no username fails with status 400 and returns an error message', async () => {
      const usersAtStart = await helper.usersInDb()

      newUser = {
        //username missing
        name: 'abcdefg',
        password: 'salasana'
      }

      const result = await api
        .post(API_BASE_URL)
        .send(newUser)
        .expect(400)

      const usersAtEnd = await helper.usersInDb()

      expect(usersAtEnd.length).toBe(usersAtStart.length)

      expect(result.body.error).toContain('username', 'password', 'required')

    })

    test('creating an user with no username and no password fails with status 400 and returns an error message', async () => {
      const usersAtStart = await helper.usersInDb()

      newUser = {
        // username missing
        name: 'abcdefg'
        //password missing
      }

      const result = await api
        .post(API_BASE_URL)
        .send(newUser)
        .expect(400)

      const usersAtEnd = await helper.usersInDb()

      expect(usersAtEnd.length).toBe(usersAtStart.length)

      expect(result.body.error).toContain('username', 'password', 'required')

    })
  })

})


afterAll(() => {
  mongoose.connection.close()
})