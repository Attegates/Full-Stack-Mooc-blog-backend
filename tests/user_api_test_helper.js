const User = require('../models/user')

const initialUsers = [
  {
    username: 'atteg',
    name: 'Atte Gates',
    password: 'salasana'
  },
  {
    username: 'lost master of the universe',
    name: 'L.M.U',
    password: 'planetsatan'
  }
]

const newUniqueUser = {
  username: '100 nakkia',
  name: "Lord Satanachia",
  password: "salasana"
}

const newNonUniqueuser = initialUsers[0]

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialUsers,
  newUniqueUser,
  newNonUniqueuser,
  usersInDb
}