import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject, postConstruct} from 'inversify';
import logger from '../util/logger';
import {Job, Queue} from 'bull';
import {PdfJob} from '../model/PdfJob';
import AppConfig from '../interfaces/AppConfig';
import {KeycloakService} from '../service/KeycloakService';
import {WebhookJob} from '../model/WebhookJob';
import axiosInstance from '../util/axios';
import HttpStatus from 'http-status-codes';

@provide(TYPE.WebhookProcessor)
export class WebhookProcessor {

    constructor(@inject(TYPE.WebhookPostQueue) private readonly webhookQueue: Queue<PdfJob>,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.KeycloakService) private readonly kecycloakService: KeycloakService) {

    }

    @postConstruct()
    public init(): void {
        this.webhookQueue.process(async (job: Job, done: any) => {
            const webhookJob: WebhookJob = job.data;
            const accessToken = await this.kecycloakService.getAccessToken();
            try {
                logger.info(`Sending webhook notificaton for pdf generated`);
                const response = await axiosInstance.post(webhookJob.url, webhookJob.payload, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const responseStatus = response.status;
                if (responseStatus === HttpStatus.OK || responseStatus === HttpStatus.ACCEPTED) {
                    done(null, {
                        status: responseStatus,
                        message: `${webhookJob.url} successfully posted`,
                    });
                } else {
                    if (responseStatus === HttpStatus.SERVICE_UNAVAILABLE
                        || responseStatus === HttpStatus.BAD_REQUEST) {
                        logger.warn('Retryable Http exception');
                        job.retry();
                    } else {
                        const message = 'Failed to post to web hook url ' + webhookJob.url +
                            ' due to ' + JSON.stringify(response.data);
                        done(new Error(message), null);
                    }
                }
            } catch (err) {
                logger.error(err);
                done(err);
            }
        });
    }
}
