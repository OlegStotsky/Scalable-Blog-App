const Page = require('./helpers/CustomPage');
const sessionFactory = require('./factories/sessionFactory');
const userFactory = require('./factories/userFactory');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

test('the header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster');
});

test('clicking login starts oauth flow', async () => {
  await page.click('.right a');

  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test('when logged in, show logout button', async () => {
  await page.login();

  const logout = await page.getContentsOf('a[href="/auth/logout"]');
  expect(logout).toEqual('Logout');
});

