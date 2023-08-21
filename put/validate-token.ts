/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

export const tokenVerifyHandler = async (event: APIGatewayProxyEvent): Promise<boolean> => {
    const authorizationHeader = event.headers.Authorization;
    let ret = false;
    
    try {
        if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            // Extraire le bearer token en supprimant le préfixe "Bearer "
            const bearerToken = authorizationHeader.replace(/^Bearer\s+/, '');
            const secretKey = process.env.SECRET_KEY as string;
            const decoded = jwt.verify(bearerToken, secretKey);

            ret = decoded ? true : false;
        }

        return ret; // Token valide
    } catch (error) {
        return ret; // Token invalide
    }
};
