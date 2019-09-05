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
import os from 'os';
import v8 from 'v8';

const totalHeapSize = v8.getHeapStatistics().total_available_size;
const totalHeapSizeGb = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);
logger.info(`totalHeapSizeGb: ${totalHeapSizeGb}`);

if (cluster.isMaster) {
    const cpuCount = os.cpus().length;
    logger.info(`CPU count: ${cpuCount}`);
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
