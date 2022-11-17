const AWS = require('aws-sdk');
const https = require('https');

AWS.config.update({ region: 'eu-west-1' });

const agent = new https.Agent({ keepAlive: true });
const documentClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true,
  httpOptions: { agent },
});

const call = (action, params) => {
  return documentClient[action](params).promise()
    .catch(e => {
      console.error(e);
      console.error(`error calling documentClient with action [${action}] and params [${JSON.stringify(params)}]`);
      return Promise.reject(e);
    });
};

module.exports = call;
module.exports.call = call;

const listWithPagination = (action, params, dataParam) => {
  const listImpl = (accumulator, token) => {
    const newParams = {
      ...params,
      ExclusiveStartKey: token,
    };
    return call(action, newParams)
      .then((data) => {
        const { LastEvaluatedKey: tokenValue } = data;
        const elts = [...accumulator, ...data[dataParam]];
        if (tokenValue) {
          return listImpl(elts, tokenValue);
        }
        // All users have been retrieved
        return elts;
      });
  };
  return listImpl([], null);
};
module.exports.listWithPagination = listWithPagination;