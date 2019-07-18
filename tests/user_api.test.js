const mongoose = require('mongoose')
const supertest = require('supertest')
const User = require('../models/user')
const helper = require('./user_api_test_helper')
const app = require('../app')

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
  })

})


afterAll(() => {
  mongoose.connection.close()
})