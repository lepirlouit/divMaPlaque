'use strict';
const AWS = require("aws-sdk");

const genericTable = require('./genericDaoTable');
const divService = require('./divService');
const plaqueService = require('./plaqueService');
const lambda = new AWS.Lambda();

const runHandleTimeBasedMovingsLambda = (events) => {

  const params = {
    FunctionName: process.env.HANDLE_TIME_BASED_MOVINGS_LAMBDA,
    InvocationType: "Event",
    Payload: JSON.stringify(events),
  };
  return lambda.invoke(params).promise();
};

module.exports.helloWorld = async (event) => {
  console.log({ event });


  const last = event?.source !== "aws.events" && event?.last ? event.last : await genericTable.getLastPlate();
  const counter = event?.counter ? event.counter : 0;


  const status = await divService.getStatus(last);

  await Promise.all([
    genericTable.storeStatus(last, status),
    genericTable.putLastPlate(plaqueService.getNextPlaque(last)),
    counter <= 200 ? runHandleTimeBasedMovingsLambda({ last: plaqueService.getNextPlaque(last), counter: counter + 1 }) : undefined
  ]);

  console.log({ last, status });

};
