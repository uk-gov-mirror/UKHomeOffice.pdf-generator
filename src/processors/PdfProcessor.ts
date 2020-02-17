import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject, postConstruct} from 'inversify';
import {Job, Queue} from 'bull';
import {PdfJob} from '../model/PdfJob';
import logger from '../util/logger';
import * as cluster from 'cluster';
import AppConfig from '../interfaces/AppConfig';
import {FormWizardPdfGenerator} from '../pdf/FormWizardPdfGenerator';
import {FormPdfGenerator} from '../pdf/FormPdfGenerator';
import {KeycloakService} from '../service/KeycloakService';
import {WebhookJob} from '../model/WebhookJob';
import {ApplicationConstants} from '../constant/ApplicationConstants';
import axiosInstance from '../util/axios';

@provide(TYPE.PdfProcessor)
export class PdfProcessor {
    constructor(@inject(TYPE.PDFQueue) private readonly pdfQueue: Queue<PdfJob>,
                @inject(TYPE.WebhookPostQueue) private readonly webhookQueue: Queue<WebhookJob>,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.KeycloakService) private readonly kecycloakService: KeycloakService,
                @inject(TYPE.FormWizardPdfGenerator) private readonly formWizardPdfGenerator: FormWizardPdfGenerator,
                @inject(TYPE.FormPdfGenerator) private readonly formPdfGenerator: FormPdfGenerator) {

    }

    @postConstruct()
    public init(): void {
        logger.info(`PDF job processing ready`, {
            cluster: {
                workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
            },
        });
        this.pdfQueue.on('completed', async (job: Job, result: any) => {
            const data = result.data.payload.data;
            logger.info(`${data.message}`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                    jobId: job.id,
                },
                fileLocation: data.fileLocation,
            });
            await job.remove();
        });
        this.pdfQueue.on('failed', async (job, error) => {
            if (job.attemptsMade < job.opts.attempts) {
                logger.warn(`PDF generation failed..retrying. Retry ${job.attemptsMade} of ${job.opts.attempts}`
                    , {
                        error: error.message,
                        cluster: {
                            workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                            jobId: job.id,
                        },
                    });
            } else {
                logger.warn('Max retry reached. Marking this job as failed and notifying web-hook queue');
                const success = new WebhookJob(job.data.webhookUrl, {
                    event: ApplicationConstants.PDF_GENERATION_FAILED,
                    data: {
                        error: error.stack,
                    },
                });
                await this.webhookQueue.add(success, {attempts: 5, backoff: 5000});
                logger.warn('Failed job notified via web-hook', {
                    cluster: {
                        workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                        jobId: job.id,
                    },
                });
                try {
                    await job.remove();
                    logger.info('Removed job from pdf queue');
                } catch (e) {
                    logger.warn(e.message);
                }
            }

        });
        this.pdfQueue.process(async (job: Job) => {
            return await this.handlePdf(job);
        });
    }

    public async handlePdf(job: Job): Promise<any> {
        let schema;
        const formUrl = job.data.formUrl;
        if (formUrl) {
            try {
                const accessToken = await this.kecycloakService.getAccessToken();
                const response = await axiosInstance.get(formUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                schema = response.data;
            } catch (e) {
                logger.error(`Failed to load form for ${formUrl}`, {
                    error: e.message,
                    cluster: {
                        workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                        jobId: job.id,
                    },
                });
                return Promise.reject(new Error(`Failed to load form from ${formUrl}`));
            }
        } else {
            schema = job.data.formSchema;
        }

        if (!schema) {
            return Promise.reject(new Error('No schema defined for processing'));
        }

        const formSubmission = job.data.submission;
        const formName = schema.name;
        logger.info(`Initiating pdf generation of ${formName}`, {
            businessKey: formSubmission.data.businessKey,
            cluster: {
                workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                jobId: job.id,
            },
        });
        try {
            let result: { fileLocation: string, message: string, etag: string, fileName: string } = null;
            if (schema.display === 'wizard') {
                result = await this.formWizardPdfGenerator.generatePdf(schema, formSubmission);
            } else {
                result = await this.formPdfGenerator.generatePdf(schema, formSubmission);
            }
            const success = new WebhookJob(job.data.webhookUrl, {
                event: ApplicationConstants.PDF_GENERATED_SUCCESS,
                data: {
                    message: result.message,
                    location: result.fileLocation,
                    etag: result.etag,
                    fileName: result.fileName,
                },
            });
            return await this.webhookQueue.add(success, {attempts: 5, backoff: 5000});
        } catch (error) {
            logger.error('Failed to create pdf', {
                businessKey: formSubmission.data.businessKey,
                error: error.message,
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                    jobId: job.id,
                },
            });
            return Promise.reject(error);
        }
    }

}
