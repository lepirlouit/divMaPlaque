const { v4: uuidv4 } = require("uuid");
const chunk = require('lodash.chunk');
const { call, listWithPagination } = require('./dynamodb-lib');

// eslint-disable-next-line no-underscore-dangle

const delay = (t, v) => new Promise((resolve) => {
  setTimeout(resolve.bind(null, v), t);
});

const createPutRequest = dataItem => ({
  PutRequest: {
    Item: dataItem,
  },
});

class Table {
  /**
   * [constructor description]
   * @param  {[type]} tableParams is a passthrough parameter for DynamoDB table definition
   * @param  {[type]} options     Custom options, currently supports timestamps and uuid parameters
   * @return {[type]}             [description]
   */
  constructor(tableParams, options) {
    if (this.constructor === Table) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.options = options || {};
    this.timestamps = this.options.timestamps || false;
    this.ttl = this.options.ttl || false;
    // For all fields in options.uuid an automatic UUID is generated for each PUT request
    this.uuid = this.options.uuid || [];
    this.tableParams = {
      ...tableParams,
      TableName: `${tableParams.TableName}-${process.env.STAGE}`,
    };
    this.compositeSortKey = this.options.compositeSortKey || [];
  }

  createItem(data) {
    for (let i = 0; i < this.uuid.length; i += 1) {
      // If provided don't create an UUID on the property that is marked for auto uuid.
      data[this.uuid[i]] = data[this.uuid[i]] || uuidv4();
    }
    if (this.compositeSortKey.length > 1) {
      data[this.compositeSortKey.join('#')] = this.compositeSortKey.map(key => data[key]).join('#');
    }
    if (this.timestamps) {
      if (data.createTime) {
        data.updateTime = new Date().toISOString();
      } else {
        data.createTime = new Date().toISOString();
        if (this.ttl && !data.ttl) {
          data.ttl = Math.floor(new Date().getTime() / 1000) + this.ttl;
        }
      }
    }
    return data;
  }

  batchWrite(params, retries = 0) {
    return delay(((2 ** retries) * 100) - 100)
      .then(() => call('batchWrite', params))
      .then((result) => {
        if (Object.keys(result.UnprocessedItems).length !== 0) {
          console.log('handle UnprocessedItems in batch :', JSON.stringify(result.UnprocessedItems, null, 2));
          return this.batchWrite({ RequestItems: result.UnprocessedItems }, retries + 1);
        }
        return result;
      });
  }

  batchRead(params, retries = 0) {
    return delay(((2 ** retries) * 100) - 100)
      .then(() => call('batchGet', params))
      .then((result) => {
        if (Object.keys(result.UnprocessedKeys).length !== 0) {
          console.log('handle UnprocessedItems in batch :', JSON.stringify(result.UnprocessedKeys, null, 2));
          return this.batchRead({ RequestItems: result.UnprocessedKeys }, retries + 1);
        }
        return result;
      });
  }

  delete(key) {
    const params = {
      TableName: this.tableParams.TableName,
      Key: key,
    };
    return call('delete', params);
  }

  get(key) {
    const params = {
      TableName: this.tableParams.TableName,
      Key: key,
    };
    return call('get', params)
      .then(({ Item }) => Item)
      .catch(err => {
        console.log(err, "key not found : ", key, "In table : ", this.tableParams.TableName);
        return null;
      });
  }

  tryGet(key) {
    const params = {
      TableName: this.tableParams.TableName,
      Key: key,
    };
    return call("get", params);
  }

  scanAll() {
    const params = {
      TableName: this.tableParams.TableName,
    };

    return listWithPagination('scan', params, 'Items');
  }

  update(data, Key, UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames, ConditionExpression, ReturnValues) {
    data.updateTime = new Date().toISOString();
    const params = {
      TableName: this.tableParams.TableName,
      Key,
      UpdateExpression,
      ExpressionAttributeValues,
      ExpressionAttributeNames,
      ConditionExpression,
      ReturnValues,
    };
    return call('update', params);

  }

  insertOrUpdate(data) {
    data.updateTime = new Date().toISOString();
    const fieldsToUpdate = Object.keys(data).filter(f => f !== this.tableParams.HashKey && f !== this.tableParams.SortKey && data[f]);
    const fieldsToRemove = Object.keys(data).filter(f => !data[f]);
    const updateExpressionFields = fieldsToUpdate.map(f => `#${f} = :${f}`).join(',');
    const updateExpressionFieldsToRemove = fieldsToRemove.map(f => `#${f}`).join(',');
    return this.update(
      data,
      {
        [this.tableParams.HashKey]: data[this.tableParams.HashKey],
        [this.tableParams.SortKey]: data[this.tableParams.SortKey]
      },
      `set ${updateExpressionFields}${fieldsToRemove.length ? ` REMOVE ${updateExpressionFieldsToRemove}` : ""}`,
      fieldsToUpdate.reduce((acc, elt) => {
        acc[`:${elt}`] = data[elt];
        return acc;
      }, {}),
      [...fieldsToUpdate, ...fieldsToRemove].reduce((acc, elt) => {
        acc[`#${elt}`] = elt;
        return acc;
      }, {}),
    );
  }

  query(KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames, IndexName, ExclusiveStartKey, extraParams) {
    const params = {
      TableName: this.tableParams.TableName,
      IndexName,
      KeyConditionExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ExclusiveStartKey,
      ...extraParams,
    };

    return call('query', params);
  }

  queryAll(KeyConditionExpression, ExpressionAttributeValues, IndexName, extraParams, maxPages = 0) {
    const listImpl = (accumulator, token, page) => {
      const params = {
        TableName: this.tableParams.TableName,
        IndexName,
        KeyConditionExpression,
        ExpressionAttributeValues,
        ...extraParams,
        ExclusiveStartKey: token,
      };
      return call('query', params)
        .then((data) => {
          const { LastEvaluatedKey: tokenValue } = data;
          const elts = [...accumulator, ...data.Items];
          if (tokenValue && (maxPages !== 0 ? page < maxPages : true)) {
            return listImpl(elts, tokenValue, page + 1);
          }
          // All items have been retrieved
          return elts;
        });
    };
    return listImpl([], null, 0);
  }


  callPut(itemData, conditionExpression, expressionAttributeValues, expressionAttributeNames) {
    console.log('put in Table : ', this.tableParams.TableName);
    return call('put', {
      TableName: this.tableParams.TableName,
      Item: itemData,
      ConditionExpression: conditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    });
  }

  put(data, conditionExpression, expressionAttributeValues, expressionAttributeNames) {
    const itemData = this.createItem(data);
    return this.callPut(itemData, conditionExpression, expressionAttributeValues, expressionAttributeNames);
  }

  putAll(dataArray) {
    console.log(`put ${dataArray.length} items in Table : `, this.tableParams.TableName);
    const putRequestsArray = dataArray.map(i => createPutRequest(this.createItem(i)));
    return Promise.all(chunk(putRequestsArray, 25).map(e => this.batchWrite({ RequestItems: { [this.tableParams.TableName]: e } })));
  }

  getAll(dataArray, batchSize = 25, projection = null, expName = null) {
    if (batchSize > 100) {
      batchSize = 100;
    }
    const createGetRequest = dataKey => ({
      [this.tableParams.HashKey]: dataKey,
    });
    const getRequestsArray = dataArray.map(i => createGetRequest(i));
    return Promise.all(
      chunk(getRequestsArray, batchSize).map(e =>
        this.batchRead({ RequestItems: { [this.tableParams.TableName]: { Keys: e, ProjectionExpression: projection, ExpressionAttributeNames: expName } } })
          .then(result => result.Responses[this.tableParams.TableName])
      )).then(allChunksResults => allChunksResults.reduce((elt, acc) => [...elt, ...acc], []));
  }
}

module.exports = Table;