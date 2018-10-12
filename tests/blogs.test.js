const Page = require('./helpers/CustomPage');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('localhost:3000');
});

afterEach(async () => {
    await page.close();
});

test('When logged in, can see blog create form', async () => {
    await page.login();
    await page.click('.fixed-action-btn a');

    const label = await page.getContentsOf('form .title label');
    expect(label).toEqual('Blog Title');
});

