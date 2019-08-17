import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject, postConstruct} from 'inversify';
import {Job, Queue} from 'bull';
import {PdfJob} from '../pdf/PdfJob';
import logger from '../util/logger';
import * as cluster from 'cluster';
import AppConfig from '../interfaces/AppConfig';
import {FormWizardPdfGenerator} from '../pdf/FormWizardPdfGenerator';
import {FormPdfGenerator} from '../pdf/FormPdfGenerator';
import {KeycloakService} from '../service/KeycloakService';
import axios from '../util/axios';
import HttpStatus from 'http-status-codes';

@provide(TYPE.PdfProcessor)
export class PdfProcessor {
    constructor(@inject(TYPE.PDFQueue) private readonly pdfQueue: Queue<PdfJob>,
                @inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.KeycloakService) private readonly kecycloakService: KeycloakService,
                @inject(TYPE.FormWizardPdfGenerator) private readonly formWizardPdfGenerator: FormWizardPdfGenerator,
                @inject(TYPE.FormPdfGenerator) private readonly formPdfGenerator: FormPdfGenerator) {

    }

    @postConstruct()
    public init(): void {
        this.pdfQueue.on('completed', async (job: Job, result: any) => {
            logger.info(`${result.message}`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                    jobId: job.id,
                },
                fileLocation: result.fileLocation,
            });
        });
        this.pdfQueue.on('failed', async (job) => {
            logger.error(`PDF generation job failed`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                    jobId: job.id,
                },
            });

        });
        this.pdfQueue.process(async (job: Job, done: any) => {
            const schema = job.data.formSchema;
            const formSubmission = job.data.submission;
            const formName = schema.name;
            logger.info(`Initiating pdf generation of ${formName}`);

            try {
                let result: { fileLocation: string, message: string } = null;
                if (schema.display === 'wizard') {
                    result = await this.formWizardPdfGenerator.generatePdf(schema, formSubmission);
                } else {
                    result = await this.formPdfGenerator.generatePdf(schema, formSubmission);
                }

                const accessToken = await this.kecycloakService.getAccessToken();

                const response = await axios.post(job.data.webhookUrl, {
                    event: 'pdf-generated',
                    data: {
                        fileLocation: result.fileLocation,
                    },
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (response.status === HttpStatus.OK || response.status === HttpStatus.ACCEPTED) {
                    logger.info(`Webhook post successful`);
                    done(null, result);
                    await job.remove();
                }

            } catch (err) {
                logger.error('PDF generation failed', err);

                done(err);
            }
        });
    }

}
