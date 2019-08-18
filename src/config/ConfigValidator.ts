import * as Joi from '@hapi/joi';
import {ValidationResult} from '@hapi/joi';
import AppConfig from '../interfaces/AppConfig';

export class ConfigValidator {
    private readonly schema: Joi.Schema;

    constructor() {
        this.schema = Joi.object().keys({
            keycloak: Joi.object({
                sessionSecret: Joi.string().required(),
                protocol: Joi.string().required(),
                uri: Joi.string().required(),
                realm: Joi.string().required(),
                client: Joi.object().keys({
                    secret: Joi.string().required(),
                    id: Joi.string(),
                }),
            }),
            arena: Joi.object().optional().keys({
                accessRoles: Joi.array().items(Joi.string()).optional()
            }),
            port: Joi.number().optional(),
            redis: Joi.object().keys({
                port: Joi.number(),
                host: Joi.string(),
                token: Joi.string(),
            }),
            correlationIdRequestHeader: Joi.string(),
            aws: Joi.object().optional().keys({
                s3: Joi.object().keys({
                    protocol: Joi.string(),
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
