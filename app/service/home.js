'use strict';

require('dotenv').config();
const redis = require('redis');
const { promisify } = require('util');
const Service = require('egg').Service;

const REDIS_PORT = process.env.PORT || 6379;
const client = redis.createClient(REDIS_PORT);
const getAsync = promisify(client.get).bind(client);
const setexAsync = promisify(client.setex).bind(client);

class HomeService extends Service {
  async stars(owner, name) {
    const key = `${owner}/${name}`;
    const stars = await getAsync(key);

    function setResponse(name, stars) {
      return { msg: `${name} has ${stars} stars.` };
    }

    // 有数据使用缓存
    if (stars !== null) {
      return setResponse(name, stars);
    }

    // 没有数据发送请求
    const query = `
      query {
        repository(owner: ${owner}, name: ${name}) {
          stargazers {
            totalCount
          }
        }
      }
    `;

    const result = await this.ctx.curl('https://api.github.com/graphql', {
      method: 'POST',
      dataType: 'json',
      headers: {
        Authorization: `token ${process.env.TOKEN}`, // 从环境变量中拿到 token
      },
      data: JSON.stringify({ query }), // post 请求的数据要用 JSON.stringify 方法传给 Github 接口，否则出现解析错误
      timeout: 10000,
    });

    const data = result.data.data;

    // 将返回的数据写入 redis，10 秒后过期
    await setexAsync(key, 10, data.repository.stargazers.totalCount);
    return setResponse(name, data.repository.stargazers.totalCount);
  }
}

module.exports = HomeService;
