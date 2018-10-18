const puppeteer = require('puppeteer');
const userFactory = require('../factories/userFactory');
const sessionFactory = require('../factories/sessionFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: (target, property) => {
        return browser[property] || customPage[property] || page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({
      name: 'session',
      value: session,
      url: 'http://localhost'
    });
    await this.page.setCookie({
      name: 'session.sig',
      value: sig,
      url: 'http://localhost'
    });
    await this.page.goto('http://localhost:3000/blogs')
    await this.page.waitFor('a[href="/auth/logout');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }
}

module.exports = CustomPage;
