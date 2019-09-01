'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  async stars() {
    const { ctx, service } = this;
    const { owner, name } = ctx.query;

    ctx.body = await service.home.stars(owner, name);
  }
}

module.exports = HomeController;
