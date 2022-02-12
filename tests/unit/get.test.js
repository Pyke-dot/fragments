// tests/unit/get.test.js
const { Fragment } = require('../../src/model/fragment');
const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    await request(app)
      .post('/v1/fragments')
      .send('this is fragment 1')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('route query', async () => {
    await request(app)
      .post('/v1/fragments')
      .send('this is fragment 2')
      .set('Content-type', 'text/plain')
      .auth('user2@email.com', 'password2');

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user2@email.com', 'password2');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    console.log(res.body);
  });

  test('get request by id', async () => {
    const data = Buffer.from('hello');
    const fragment = new Fragment({
      ownerId: 'b0194b2e11548b547ddaff0e105b22347f94b625a7b964d7db72e1658c461a7f',
      type: 'text/plain',
      size: 0,
    });
    await fragment.save();
    await fragment.setData(data);

    const res = await request(app)
      .get('/v1/fragments/' + fragment.id)
      .auth('user2@email.com', 'password2');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toBe('hello');
    console.log(res.body.fragments);
  });
});
