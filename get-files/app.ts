/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';
import { tokenVerifyHandler } from './validate-token';

// interface MyGetObjectRequest extends AWS.S3.GetObjectRequest {
//   Expires: number;
// }

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();
export const handler = async (event: APIGatewayProxyEvent): Promise<any> => {
    try {
      if (!(await tokenVerifyHandler(event))) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Token invalid' })
          }; 
    }
    const table = process.env.DYNAMODB_TABLE as string
    const params = {
      TableName: table,
    };

      // write the todo to the database
      const result = await dynamoDb.scan(params).promise();
      const items = result.Items
      const bucketName = 'devfest-file';
  
      // Récupérer la liste des objets dans le bucket
      const objects = await listAllObjects(s3, bucketName);
      // Télécharger chaque fichier
        for (const o of objects) {
          const fileKey = o.Key as string;
          const s3Url = await downloadFile(s3, bucketName, fileKey);
          // const fileBase64 = `data:image/png;base64,  ${buf.toString('base64')}`
          items?.forEach(i => {
            if(i.fileName === fileKey) {
              i.s3Url = s3Url
            }
          })
          }

    return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
    };

    } catch (error) {
      console.error('Erreur lors du téléchargement des fichiers :', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'download failed' }),
    };
    }
  };
  
  const listAllObjects = async (
    s3: AWS.S3,
    bucketName: string
  ): Promise<AWS.S3.Object[]> => {
    let objects: AWS.S3.Object[] = [];
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
  
    while (isTruncated) {
      const response = await listObjects(s3, bucketName, continuationToken);
      objects = objects.concat(response.Contents || []);
      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }
  
    return objects;
  };
  
  const listObjects = async (
    s3: AWS.S3,
    bucketName: string,
    continuationToken?: string
  ): Promise<AWS.S3.ListObjectsV2Output> => {
    const listObjectsParams: AWS.S3.ListObjectsV2Request = {
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    };
  
    const response = await s3.listObjectsV2(listObjectsParams).promise();
    return response;
  };
  
  const downloadFile = async (
    s3: AWS.S3,
    bucketName: string,
    fileKey: string
  ): Promise<string> => {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + 86400);
    const downloadParams: AWS.S3.GetObjectRequest = {
      Bucket: bucketName,
      Key: fileKey,
      ResponseExpires: expires
    };
  
    return s3.getSignedUrl('getObject', downloadParams);
  };
