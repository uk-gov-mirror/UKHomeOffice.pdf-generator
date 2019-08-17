import 'reflect-metadata';
import {expect} from "chai";
import config from "../../../src/config/defaultAppConfig";


describe('appConfig', () => {
   it('can get app config', () => {
       config.keycloak.url = 'http://keycloak.lodev.xyz/auth';
        config.keycloak.realm = 'dev';

       expect(config).to.be.not.null;
       expect(config.keycloak).to.be.not.null;
       expect(config.keycloak.url).to.be.eq('http://keycloak.lodev.xyz/auth');
       expect(config.keycloak.realm).to.be.eq('dev');

   });
});
