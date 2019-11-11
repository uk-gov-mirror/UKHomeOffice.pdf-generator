import 'reflect-metadata';
import express, {Application} from 'express';
import {InversifyExpressServer} from 'inversify-express-utils';
import TYPE from './constant/TYPE';
import {ApplicationContext} from './container/ApplicationContext';
import './controller';
import logger from './util/logger';
import AppConfig from './interfaces/AppConfig';
import {ApplicationConstants} from './constant/ApplicationConstants';
import {ConfigValidator} from './config/ConfigValidator';
import {EventEmitter} from 'events';
import cluster from 'cluster';
import v8 from 'v8';
import Arena from 'bull-arena';
import Keycloak, {Token} from 'keycloak-connect';
import session from 'express-session';
import httpContext from 'express-http-context';

const totalHeapSize = v8.getHeapStatistics().total_available_size;
const totalHeapSizeGb = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);
logger.info(`totalHeapSizeGb: ${totalHeapSizeGb}`);

if (cluster.isMaster) {
    const cpuCount = 3;
    logger.info(`CPU count: ${cpuCount}`);
    const applicationContext: ApplicationContext = new ApplicationContext();
    const container = applicationContext.iocContainer();

    const appConfig: AppConfig = container.get(TYPE.AppConfig);
    const arenaExpressApp: Application = express();

    let redisConfig;
    if (appConfig.redis.ssl) {
        redisConfig = {
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,
            tls: {},
        };
    } else {
        redisConfig = {
            port: appConfig.redis.port,
            host: appConfig.redis.host,
            password: appConfig.redis.token,
        };
    }

    const arenaConfig = Arena({
            queues: [
                {
                    name: ApplicationConstants.PDF_QUEUE_NAME,
                    hostId: 'PDFGeneratorQueues',
                    redis: redisConfig,
                },
                {
                    name: ApplicationConstants.WEB_HOOK_POST_QUEUE_NAME,
                    hostId: 'Web-HookQueues',
                    redis: redisConfig,
                },
            ],
        },
        {
            basePath: '/arena',
            disableListen: true,
        });

    const kcConfig = {
        'realm': appConfig.keycloak.realm,
        'auth-server-url': `${appConfig.keycloak.uri}`,
        'ssl-required': 'external',
        'bearer-only': false,
        'resource': appConfig.keycloak.client.id,
        'credentials': {
            secret: appConfig.keycloak.client.secret,
        },
        'confidential-port': 0,
    };
    const memoryStore: session.MemoryStore = new session.MemoryStore();

    const keycloak: Keycloak = new Keycloak({store: memoryStore}, kcConfig);
    arenaExpressApp.use(session({
        secret: appConfig.keycloak.sessionSecret,
        resave: false,
        saveUninitialized: true,
        store: memoryStore,
    }));

    arenaExpressApp.use(keycloak.middleware());
    arenaExpressApp.use('/admin', keycloak.protect((token: Token, req: express.Request) => {
        if (appConfig.arena.accessRoles.length !== 0) {
            let hasAccess = false;
            appConfig.arena.accessRoles.forEach((role: string) => {
                hasAccess = token.hasRealmRole(role);
            });
            return hasAccess;
        } else {
            return true;
        }
    }), arenaConfig);

    arenaExpressApp.use(httpContext.middleware);

    arenaExpressApp.listen(appConfig.arena.port, () => {
        logger.info(`Arena running on ${appConfig.arena.port}`);
    });

    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }
} else {
    const applicationContext: ApplicationContext = new ApplicationContext();
    const container = applicationContext.iocContainer();

    const appConfig: AppConfig = container.get(TYPE.AppConfig);
    const port = appConfig.port;

    const eventEmitter: EventEmitter = container.get(TYPE.EventEmitter);

    const configValidator = new ConfigValidator();
    const result = configValidator.validate(appConfig);
    if (result.error) {
        logger.error('Config failed validation', result.error.details);
        process.exit(1);
    }
    const basePath = ``;

    const expressApp: Application = express();
    expressApp.get("/tmp/:fileName", (req, res) => {
        // @ts-ignore
        res.sendFile(`/tmp/${req.params.fileName}`);
    });

    expressApp.use('/node_modules', express.static('./node_modules/'));
    expressApp.use('/assets', express.static('./node_modules/govuk-frontend/govuk/assets'));
    const server = new InversifyExpressServer(container,
        null,
        {rootPath: basePath},
        expressApp);

    const clearUp = async () => {
        eventEmitter.emit(ApplicationConstants.SHUTDOWN_EVENT);
        process.exit(1);
    };

    process.on('SIGTERM', async () => {
        clearUp().then(() => {
            logger.info('all cleaned and finished');
        });
    });
    process.on('SIGINT', async () => {
        clearUp().then(() => {
            logger.info('all cleaned and finished');
        });
    });

    process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
        logger.error('unhandledRejection', {
            exception: reason.stack,
        });
    });

    process.on('uncaughtException', (error) => {
        logger.error('uncaughtException', error);
    });

    const expressApplication = server.build();

    expressApplication.listen(port);
    logger.info('Server up and running on ' + port);

    exports = module.exports = expressApplication;
}
