/* eslint-disable prettier/prettier */
import { APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const tokenHandler = async (): Promise<APIGatewayProxyResult> => {
    try {
        // Informations à inclure dans le JWT
        const admin = 'admin';
        const permissions = ['read', 'write'];
        
        // Créer le payload du JWT
        const payload = {
          sub: admin,
          permissions: permissions,
          // Autres informations facultatives
        };
        
        // Clé secrète pour signer le JWT
        const secretKey = process.env.SECRET_KEY as string;
    
        // Générer le JWT
        const token = jwt.sign(payload, secretKey, { expiresIn: '3d' });
    
        return {
          statusCode: 200,
          body: token,
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Erreur lors de la génération du token' }),
        };
      }
};
