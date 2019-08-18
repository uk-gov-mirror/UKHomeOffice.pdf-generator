import 'reflect-metadata';
import {expect} from 'chai'
import {KeycloakService} from '../../../src/service/KeycloakService';
import defaultAppConfig from '../../../src/config/defaultAppConfig';
// @ts-ignore
import nock from 'nock'

import * as querystring from 'querystring';

describe('KeycloakService', () => {
    const keycloakService = new KeycloakService(defaultAppConfig);

    const settings = {
        'grant_type': 'client_credentials',
    };

    beforeEach(() => {
        nock('http://localhost:8080/auth', {
            reqheaders: {
                'Content-type': 'application/x-www-form-urlencoded'
            }
        }).log(console.log)
            .post('/realms/elf/protocol/openid-connect/token', querystring.stringify(settings))
            .reply(200, {'access_token': 'access-token-generated'});
    });

    it('should return access token', async () => {
        const token = await keycloakService.getAccessToken();
        expect(token).to.be.eq('access-token-generated');
    });
});
