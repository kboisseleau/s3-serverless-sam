/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3, DynamoDB } from 'aws-sdk';
import { tokenVerifyHandler } from './validate-token';
import * as parser from 'lambda-multipart-parser'
import * as uuid from 'uuid'
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();
export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!(await tokenVerifyHandler(event))) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Token invalid' })
              }; 
        }
        const formDataParsed = await parser.parse(event)
        const { content, filename, contentType } = formDataParsed.files[0];
        const bucketName = 'devfest-file';
        const fileName = filename;

        await s3
            .upload({
                Bucket: bucketName,
                Key: fileName,
                Body: content,
                ContentDisposition: `attachment; filename="${filename}";`,
                ContentType: contentType,
            })
            .promise();

            
            const timestamp = new Date().getTime();
            const table = process.env.DYNAMODB_TABLE as string
            const params = {
                TableName: table,
                Item: {
                  id: uuid.v1(),
                  fileName,
                  vote: 0,
                  tokens: [],
                  createdAt: timestamp,
                  updatedAt: timestamp,
                },
              };

              await dynamoDb.put(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Upload successfull' }),
        };
    } catch (error) {
        console.error('Error uploading file:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Upload failed' }),
        };
    }
};


