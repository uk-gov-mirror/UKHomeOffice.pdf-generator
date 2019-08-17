import * as Joi from '@hapi/joi';
import {ValidationResult} from '@hapi/joi';
import AppConfig from '../interfaces/AppConfig';

export class ConfigValidator {
    private readonly schema: Joi.Schema;

    constructor() {
        this.schema = Joi.object().keys({
            keycloak: Joi.object({
                protocol: Joi.string().required(),
                url: Joi.string().required(),
                realm: Joi.string().required(),
                client: Joi.object().keys({
                    secret: Joi.string().required(),
                    id: Joi.string(),
                }),
            }),
            redis: Joi.object().keys({
                port: Joi.number(),
                host: Joi.string(),
                token: Joi.string(),
            }),
            correlationIdRequestHeader: Joi.string(),
            aws: Joi.object().optional().keys({
                s3: Joi.object().keys({
                    endpoint: Joi.string().optional(),
                    useSSL: Joi.boolean().optional(),
                    port: Joi.number().optional(),
                    accessKey: Joi.string().optional(),
                    secretKey: Joi.string().optional(),
                    buckets: Joi.object().optional().keys({
                        pdf: Joi.string().optional(),
                    }),
                }),
            }),
        });
    }

    public validate(config: AppConfig): ValidationResult<any> {
        return Joi.validate(config, this.schema, {abortEarly: false});
    }
}
