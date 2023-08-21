/* eslint-disable prettier/prettier */
import * as jwt from 'jsonwebtoken';

export const tokenHandler = async (): Promise<string> => {
        // Informations à inclure dans le JWT

        // Créer le payload du JWT
        const payload = {
            uuid: uuid()
        };

        // Clé secrète pour signer le JWT
        const secretKey = process.env.SECRET_KEY_VOTE as string;

        // Générer le JWT
        const token = jwt.sign(payload, secretKey, { expiresIn: '3d' });

        return token
};

const uuid = (): string => {
    let dt = new Date().getTime()
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (dt + Math.random() * 16) % 16 | 0
      dt = Math.floor(dt / 16)
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })

    return uuid
  }

