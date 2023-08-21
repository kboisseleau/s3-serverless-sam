/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { tokenVerifyHandler } from './validate-token';
import { tokenHandler } from './generate-token'
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const dynamoDb = new DynamoDB.DocumentClient();
export const putHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const body = event.body as string;
  const data = JSON.parse(body)
  
  await verifyAccessAndField(event, data)
  
  let token
  const { id } = event.pathParameters as { id: string }
  const item = await getDataFile(id)
  const tokens = item.tokens
  console.log(data)
  if (data.token) {
    console.log('ifTokenExist(data.token, tokens)', ifTokenExist(data.token, tokens))
    if (ifTokenExist(data.token, tokens)) {
      thenRemoveToken(data.token, tokens)
      item.vote = item.vote - 1
    } else {
      tokens.push(data.token)
      item.vote = item.vote + 1
    }
  } else {
    token = await tokenHandler()
    item.vote = item.vote + 1
  }
  

  item.tokens = tokens
  // await saveIP(data)
  const attributes = await updateDataFile(id, item)
  const responseBody = {
    item: attributes,
    token
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    },
    body: JSON.stringify(responseBody),
  };
};

const getDataFile = async (id: string): Promise<{tokens: string[], vote: number}> => {
  const table = process.env.DYNAMODB_TABLE as string
  const params = {
    TableName: table,
    Key: {
      id,
    },
  }

  try {
    const dataFile = await dynamoDb.get(params).promise()
    return dataFile.Item as { tokens: string[], vote: number}
  
} catch (error: any) {
  console.error(error)
  throw new Error('Ce fichier n\'existe pas')
  }
}

const updateDataFile = async (id: string, item: {tokens: string[], vote: number}) => {
  const timestamp = new Date().getTime();
  const table = process.env.DYNAMODB_TABLE as string
  const params = {
    TableName: table,
    Key: {
      id,
    },
    ExpressionAttributeValues: {
      ':vote': item.vote,
      ':tokens': item.tokens,
      ':updatedAt': timestamp,
    },
    UpdateExpression: 'SET vote = :vote, tokens = :tokens, updatedAt = :updatedAt',
    ReturnValues: 'ALL_NEW',
  };

  try {
    return (await dynamoDb.update(params).promise()).Attributes;
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: error,
    }
  }
}
// const saveIP = async (data: { ip: string }): Promise<unknown> => {
//   const ipTable = process.env.DYNAMODB_TABLE_IP as string
//   const ipParams = {
//       TableName: ipTable,
//       Item: {
//         id: data.ip,
//       },
//     };

//   try {
//     await dynamoDb.put(ipParams).promise();
//   } catch (error: any) {
//     return {
//       statusCode: error.statusCode || 501,
//       headers: { 'Content-Type': 'text/plain' },
//       body: error,
//     }
//   }
// }

const ifTokenExist = (token: string, tokens: string[]): boolean => {
    return tokens.includes(token)
}

const thenRemoveToken = (token: string, tokens: string[]): void => {
  tokens.splice(tokens.indexOf(token), 1)
}

const verifyAccessAndField = async (event: APIGatewayProxyEvent, data: { ip: string, vote: number }) => {
  if (!(await tokenVerifyHandler(event))) {
    return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        },
        body: JSON.stringify({ message: 'Token invalid' })
      }; 
}

    // Validate properties
    const verifyFields = ((!data.vote || !data.ip) && (typeof data.vote !== 'number' || typeof data.ip !== 'string'))

    if (verifyFields) {
      console.error('Validation Failed');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        },
        body: JSON.stringify({ message: 'Couldn\'t update the vote item.' })
      };
    }
}


