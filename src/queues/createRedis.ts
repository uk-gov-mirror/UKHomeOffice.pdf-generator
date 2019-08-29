import Redis from 'ioredis';
import AppConfig from '../interfaces/AppConfig';
import IORedis from 'ioredis';

const createRedis = (appConfig: AppConfig): IORedis.Redis => {
    if (appConfig.redis.ssl) {
        return new Redis({
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,
            tls: {
            }
        });
    }
    return new Redis({
        port: appConfig.redis.port,
        host: appConfig.redis.host,
        password: appConfig.redis.token
    });

};

export default createRedis;
