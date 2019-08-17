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
import createQueue from '../queues/create-queue';
import {PdfJob} from '../pdf/PdfJob';
import redis from '../queues/Redis';
import {ApplicationConstants} from '../constant/ApplicationConstants';
import {S3Service} from '../service/S3Service';
import {KeycloakService} from '../service/KeycloakService';

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

        const redisClient = redis(defaultAppConfig);
        const pdfQueue: Queue<PdfJob> = createQueue(redisClient,
            redisClient,
            redisClient,
            ApplicationConstants.PDF_QUEUE_NAME);
        this.container.bind<Queue>(TYPE.PDFQueue).toConstantValue(pdfQueue);

        this.container.bind<PdfProcessor>(TYPE.PdfProcessor).to(PdfProcessor);

        this.container.bind<FormWizardPdfGenerator>(TYPE.FormWizardPdfGenerator).to(FormWizardPdfGenerator);
        this.container.bind<FormPdfGenerator>(TYPE.FormPdfGenerator).to(FormPdfGenerator);

        this.container.bind<S3Service>(TYPE.S3Service).to(S3Service);

        this.container.get(TYPE.PdfProcessor);

        logger.info('Application context initialised');

        eventEmitter.on(ApplicationConstants.SHUTDOWN_EVENT, () => {
            this.container.unbindAll();
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
