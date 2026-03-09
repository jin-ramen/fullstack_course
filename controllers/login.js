const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body
  // search for the user in the db
  const user = await User.findOne({ username })
  // check password
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  // if user DNE or incorrect password
  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  // token contain username and user id in digitally signed form
  const userForToken = {
    username: user.username,
    id: user._id,
  }

  // token expires every one hour
  const token = jwt.sign(
    userForToken, process.env.SECRET,
    { expires: 60*60 }
  )

  // success request response
  response
    .status(200)
    .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter