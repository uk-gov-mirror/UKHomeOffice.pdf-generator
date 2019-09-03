import TYPE from '../constant/TYPE';
import {provide} from 'inversify-binding-decorators';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import * as querystring from 'querystring';
import axiosInstance from '../util/axios';
import logger from "../util/logger"
import HttpStatus from 'http-status-codes';

@provide(TYPE.KeycloakService)
export class KeycloakService {
    private readonly keycloakUrl: string;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        const keycloak: any = appConfig.keycloak;
        this.keycloakUrl = keycloak.uri;
    }

    public async getAccessToken(): Promise<string> {
        const data: string = querystring.stringify({
            grant_type: 'client_credentials',
        });
        try {
            const tokenResponse = await axiosInstance({
                method: 'POST',
                url: `${this.keycloakUrl}/realms/${this.appConfig.keycloak.realm}/protocol/openid-connect/token`,
                auth: {
                    username: this.appConfig.keycloak.client.id,
                    password: this.appConfig.keycloak.client.secret,
                },
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: data,
            });
            if (tokenResponse.status !== HttpStatus.OK) {
                return Promise.reject('Failed to get access token');
            }
            return Promise.resolve(tokenResponse.data.access_token);
        } catch (e) {
            logger.error(e.message);
            return Promise.reject(e);
        }
    }
}
