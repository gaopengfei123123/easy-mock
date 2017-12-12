'use strict'

const app = require('../../app')
const spt = require('../support')

describe('test/controllers/project.test.js', () => {
  let request, user

  afterAll(() => spt.cleanCollections())
  beforeAll(async () => {
    user = await spt.createUser()
    request = spt.createRequest(app.listen(), user.token)
  })

  describe('create', () => {
    test('获取数据', async () => {
      const res = await request('/api/dashboard')

      expect(res.body.data).toMatchObject({
        total: {
          userCount: expect.any(Number),
          mockCount: expect.any(Number),
          projectCount: expect.any(Number),
          mockUseCount: expect.any(Number)
        },
        today: {
          userCount: expect.any(Number),
          mockCount: expect.any(Number),
          projectCount: expect.any(Number),
          mockUseCount: expect.any(Number)
        }
      })
    })
  })
})
