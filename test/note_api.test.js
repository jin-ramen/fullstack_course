const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const assert = require('node:assert')
const helper = require('./test_helper')
const Note = require('../models/note')

// users
const bcrypt = require('bcrypt')
const User = require('../models/user')


const api = supertest(app)

beforeEach(async () => {
  await Note.deleteMany({})
  await Note.insertMany(helper.initialNotes)
})

test('notes are returned as json', async () => {
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all notes are returned', async () => {
  const response = await api.get('/api/notes')

  assert.strictEqual(response.body.length, helper.initialNotes.length)
})

test('a specific note is within the returned notes', async () => {
  const response = await api.get('/api/notes')

  const contents = response.body.map(e => e.content)
  assert.strictEqual(contents.includes('HTML is easy'), true)
})

test('a specific note can be viewed', async () => {
  const noteAtStart = await helper.notesInDb()
  const noteToView = noteAtStart[0]

  const resultNote = await api
    .get(`/api/notes/${noteToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  // console.log(resultNote)
  assert.equal(resultNote.body.content, 'HTML is easy')
})

test('a note can be deleted', async () => {
  const notesAtStart = await helper.notesInDb()
  const noteToDelete = notesAtStart[0]

  await api
    .delete(`/api/notes/${noteToDelete.id}`)
    .expect(204)

  const notesAtEnd = await helper.notesInDb()

  const ids = notesAtEnd.map(n => n.id)
  assert(!ids.includes(noteToDelete.id))

  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)
})

// user
describe.only('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDB()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDB()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const userAtStart = await helper.usersInDB()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const userAtEnd = await helper.usersInDB()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(userAtEnd.length, userAtStart.length)
  })

  test('a valid note can be added ', async () => {
    const token = await helper.getToken('root')
    assert(token, 'token should exist')

    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true,
    }

    await api
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(newNote)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()
    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

    const contents = notesAtEnd.map(n => n.content)
    assert(contents.includes('async/await simplifies making async calls'))
  })

  test('note without content is not added', async () => {
    const token = await helper.getToken('root')

    const newNote = {
      important: true,
      userId: helper.getUserId()
    }

    await api
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(newNote)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()

    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})
