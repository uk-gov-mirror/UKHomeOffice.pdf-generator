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
import * as cluster from 'cluster';

@provide(TYPE.WebhookProcessor)
export class WebhookProcessor {

    constructor(@inject(TYPE.WebhookPostQueue) private readonly webhookQueue: Queue<PdfJob>,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.KeycloakService) private readonly kecycloakService: KeycloakService) {

    }

    @postConstruct()
    public init(): void {
        logger.info(`Web-hook job processing ready`);
        this.webhookQueue.on('completed', async (job: Job, result: any) => {
            logger.info(`${result.message}`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                    jobId: job.id,
                },
                status: result.status,
            });
            await job.remove();
        });
        this.webhookQueue.on('failed', async (job: Job, error: Error) => {

            if (job.attemptsMade < job.opts.attempts) {
                logger.warn(`Web-hook post failed...retrying`, {
                    error: error.stack,
                    cluster: {
                        workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                        jobId: job.id,
                    },
                });
            } else {
                logger.error(`Web-hook job failed for ${job.data.url} after max retries.`,
                    {error: error.stack});
                try {
                    await job.finished();
                    logger.info('Removed job from webhook queue');
                } catch (e) {
                    logger.warn(e.message);
                }
            }
        });
        this.webhookQueue.process(async (job: Job) => {
            const webhookJob: WebhookJob = job.data;
            const accessToken = await this.kecycloakService.getAccessToken();

            try {
                logger.info(`Sending web-hook notification for pdf generated`);
                const response = await axiosInstance.post(webhookJob.url, webhookJob.payload, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const responseStatus = response.status;
                if (responseStatus === HttpStatus.OK || responseStatus === HttpStatus.ACCEPTED) {
                    return Promise.resolve({
                        status: responseStatus,
                        message: `${webhookJob.url} successfully posted`,
                    });
                } else {
                    return Promise.reject({
                        status: responseStatus,
                        message: `${webhookJob.url}  post failed`,
                    });
                }
            } catch (err) {
                logger.error(`Failed to perform web-hook post`, err);
                return Promise.reject(err);
            }
        });
    }

}
