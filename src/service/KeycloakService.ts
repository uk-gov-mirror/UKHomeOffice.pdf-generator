import TYPE from '../constant/TYPE';
import {provide} from 'inversify-binding-decorators';

@provide(TYPE.KeycloakService)
export class KeycloakService {

    public async getAccessToken(): Promise<string> {
        return null;
    }
}
