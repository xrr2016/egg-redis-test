'use strict';

const redis = require('redis');
const { promisify } = require('util');
const Service = require('egg').Service;

const REDIS_PORT = process.env.PORT || 6379;
const client = redis.createClient(REDIS_PORT);
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.setnx).bind(client);

class HomeService extends Service {
  async stars(owner = 'vuejs', name = 'vue') {
    const key = `${owner}/${name}`;

    function setResponse(name, stars) {
      return `<p><strong>${name}</strong> has ${stars} stars.</p>`;
    }

    const stars = await getAsync(key);

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
        Authorization: 'token 617bfc035eb8df3ed9656a887eeba2f0020751df',
      },
      data: JSON.stringify({ query }),
      timeout: 10000,
    });

    const data = result.data.data;
    await setAsync(key, data.repository.stargazers.totalCount); // 将数据写入 redis

    return setResponse(name, data.repository.stargazers.totalCount);
  }
}

module.exports = HomeService;
