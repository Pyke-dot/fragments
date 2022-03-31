// tests/unit/get.test.js
const hash = require('../../src/hash');
const request = require('supertest');
const app = require('../../src/app');
const { readFragmentData, readFragment, listFragments } = require('../../src/model/data');
const { Fragment } = require('../../src/model/fragment');

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
    await request(app)
      .post('/v1/fragments')
      .send('this is fragment 2')
      .set('Content-type', 'text/plain')
      .auth('user2@email.com', 'password2');
    var result = await listFragments(hash('user2@email.com'), 1);

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user2@email.com', 'password2');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toEqual(result);
  });
  test('get request by id', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user2@email.com', 'password2')
      .send('This is fragment 1')
      .set('Content-type', 'text/plain');

    const fragment = await readFragmentData(hash('user2@email.com'), req.body.fragment.id);

    const id = req.body.fragment.id;

    const res = await request(app)
      .get('/v1/fragments/' + id)
      .auth('user2@email.com', 'password2');

    expect(res.text).toBe(fragment.toString());
  });

  test('get request by user', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .send('This is fragment 1')
      .set('Content-type', 'text/plain');
    expect(req.statusCode).toBe(401);

    const fragment = await Fragment.byUser(hash('user2@email.com'));

    const res = await request(app).get('/v1/fragments/').auth('user2@email.com', 'password2');
    expect(fragment).toEqual(res.body.fragments);
  });

  test('id info', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user2@email.com', 'password2')
      .send('This is fragment 1')
      .set('Content-type', 'text/plain');

    const fragment = await readFragment(hash('user2@email.com'), req.body.fragment.id);

    const id = req.body.fragment.id;

    const res = await request(app)
      .get('/v1/fragments/' + id + '/info')
      .auth('user2@email.com', 'password2');

    const res1 = await request(app)
      .get('/v1/fragments/' + id + '333/info')
      .auth('user2@email.com', 'password2');

    expect(res.body).toEqual(fragment);
    expect(res1.statusCode).toBe(404);
  });

  test('convert', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('# This is a markdown')
      .set('Content-type', 'text/markdown');

    const id = req.body.fragment.id;

    const res = await request(app)
      .get('/v1/fragments/' + id + '.html')
      .auth('user1@email.com', 'password1');
    expect(res.text).toEqual('<h1>This is a markdown</h1>\n');
  });
  test('unsupported conversion', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('# This is a text')
      .set('Content-type', 'text/plain');

    const id = req.body.fragment.id;

    const res = await request(app)
      .get('/v1/fragments/' + id + '.html')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
  });
  test('fail get by id', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('# This is a text')
      .set('Content-type', 'text/plain');
    const id = req.body.fragment.id;

    const res = await request(app)
      .get('/v1/fragments/' + id + 'html')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  test('invalid id for get request', async () => {
    const res = await request(app)
      .get('/v1/fragments/invalidId')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('id does not represent a known fragment');
  });
});
