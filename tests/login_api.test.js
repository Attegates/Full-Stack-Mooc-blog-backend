const mongoose = require('mongoose')
const supertest = require('supertest')
const User = require('../models/user')
const helper = require('./user_api_test_helper')
const app = require('../app')

mongoose.set('useCreateIndex', true);

const api = supertest(app)

const API_USERS_URL = '/api/users'
const API_LOGIN_URL = '/api/login'


beforeAll(async () => {
  await User.deleteMany({})
  const newUser = {
    username: 'attegates',
    name: 'Atte Gates',
    password: 'salasana'
  }

  // save by using the api because the api handles hashing the password
  // saving straight to the db does not create a passwordHash
  //await newUser.save()
  await api
    .post(API_USERS_URL)
    .send(newUser)
})

describe('login tests', () => {
  test('logging in a valid user succeeds and returns a jwt', async () => {

    const userToLogin = {
      username: 'attegates',
      password: 'salasana'
    }

    const result = await api
      .post(API_LOGIN_URL)
      .send(userToLogin)
      .expect(200)

    expect(result.body.token).toBeDefined()
  })

  test('logging in a non existing user fails', async() => {
    const userToLogin = {
      username: 'atteg', //does not exist in these tests
      password: 'salasana'
    }

    const result = await api
    .post(API_LOGIN_URL)
    .send(userToLogin)
    .expect(401)

    expect(result.body.token).not.toBeDefined()
  })

  test('logging in a with wrong password fails', async() => {
    const userToLogin = {
      username: 'attegates',
      password: 'salis'  // wrong password
    }

    const result = await api
    .post(API_LOGIN_URL)
    .send(userToLogin)
    .expect(401)

    expect(result.body.token).not.toBeDefined()
  })
})

afterAll(() => {
  mongoose.connection.close()
})
