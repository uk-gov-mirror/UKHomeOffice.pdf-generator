import {Container} from 'inversify';
import TYPE from '../constant/TYPE';
import logger from '../util/logger';
import AppConfig from '../interfaces/AppConfig';
import defaultAppConfig from '../config/defaultAppConfig';
import {EventEmitter} from 'events';
import {FormTemplateResolver} from '../pdf/FormTemplateResolver';
import {Queue} from 'bull';
import {FormWizardPdfGenerator} from '../pdf/FormWizardPdfGenerator';
import {FormPdfGenerator} from '../pdf/FormPdfGenerator';
import {PdfProcessor} from '../processors/PdfProcessor';
import {PdfJob} from '../model/PdfJob';
import {ApplicationConstants} from '../constant/ApplicationConstants';
import {S3Service} from '../service/S3Service';
import {KeycloakService} from '../service/KeycloakService';
import {WebhookProcessor} from '../processors/WebhookProcessor';
import createQueue from '../queues/createQueue';
import S3 = require('aws-sdk/clients/s3');

export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton',

        });
        const eventEmitter = new EventEmitter();
        this.container.bind<EventEmitter>(TYPE.EventEmitter).toConstantValue(eventEmitter);
        this.container.bind<AppConfig>(TYPE.AppConfig).toConstantValue(defaultAppConfig);
        this.container.bind<FormTemplateResolver>(TYPE.FormTemplateResolver).to(FormTemplateResolver);
        this.container.bind<KeycloakService>(TYPE.KeycloakService).to(KeycloakService);

        const pdfQueue: Queue<PdfJob> = createQueue(defaultAppConfig, ApplicationConstants.PDF_QUEUE_NAME);
        this.container.bind<Queue>(TYPE.PDFQueue).toConstantValue(pdfQueue);

        const webhookQueue: Queue<PdfJob> = createQueue(defaultAppConfig,
            ApplicationConstants.WEB_HOOK_POST_QUEUE_NAME);

        this.container.bind<Queue>(TYPE.WebhookPostQueue).toConstantValue(webhookQueue);

        this.container.bind<PdfProcessor>(TYPE.PdfProcessor).to(PdfProcessor);
        this.container.bind<WebhookProcessor>(TYPE.WebhookProcessor).to(WebhookProcessor);

        this.container.bind<FormWizardPdfGenerator>(TYPE.FormWizardPdfGenerator).to(FormWizardPdfGenerator);
        this.container.bind<FormPdfGenerator>(TYPE.FormPdfGenerator).to(FormPdfGenerator);

        const s3Config = defaultAppConfig.aws.s3;
        const s3 = new S3({
            accessKeyId: s3Config.accessKey,
            secretAccessKey: s3Config.secretKey,
            region: s3Config.region,
        });

        this.container.bind<S3>(TYPE.S3).toConstantValue(s3);

        this.container.bind<S3Service>(TYPE.S3Service).to(S3Service);

        this.container.get(TYPE.PdfProcessor);
        this.container.get(TYPE.WebhookProcessor);

        logger.info('Application context initialised');

        eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            this.container.unbindAll();

            pdfQueue.close().then(() => {
                logger.info('Closed pdf queue');
            }).catch((err) => {
                logger.error('Failed to close pdf queue', err);
            });
            webhookQueue.close().then(() => {
                logger.info('Closed web-hook queue');
            }).catch((err) => {
                logger.error('Failed to close web-hook queue', err);
            });
            logger.info('Container unbindAll activated');
        });
    }

    public get<T>(serviceIdentifier: string | symbol): T {
        return this.container.get(serviceIdentifier);
    }

    public iocContainer(): Container {
        return this.container;
    }
}
