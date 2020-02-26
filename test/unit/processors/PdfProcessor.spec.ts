import 'reflect-metadata';
import {expect} from "chai";
import {Arg, Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {Job, Queue} from "bull";
import {PdfJob} from "../../../src/model/PdfJob";
import {WebhookJob} from "../../../src/model/WebhookJob";
import AppConfig from "../../../src/interfaces/AppConfig";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {KeycloakService} from "../../../src/service/KeycloakService";
import {FormWizardPdfGenerator} from "../../../src/pdf/FormWizardPdfGenerator";
import {FormPdfGenerator} from "../../../src/pdf/FormPdfGenerator";
import {PdfProcessor} from "../../../src/processors/PdfProcessor";
// @ts-ignore
import nock from "nock";

describe('PDFProcessor', () => {
    let pdfQueue: SubstituteOf<Queue<PdfJob>>;
    let webhookQueue: SubstituteOf<Queue<WebhookJob>>;
    let appConfig: AppConfig = defaultAppConfig;
    let keycloakService: SubstituteOf<KeycloakService>;
    let formWizardPdfGenerator: SubstituteOf<FormWizardPdfGenerator>;
    let formPdfGenerator: SubstituteOf<FormPdfGenerator>;
    let pdfProcessor: PdfProcessor;

    beforeEach(() => {
        pdfQueue = Substitute.for<Queue<PdfJob>>();
        webhookQueue = Substitute.for<Queue<WebhookJob>>();
        keycloakService = Substitute.for<KeycloakService>();
        formWizardPdfGenerator = Substitute.for<FormWizardPdfGenerator>();
        formPdfGenerator = Substitute.for<FormPdfGenerator>();
        pdfProcessor = new PdfProcessor(
            pdfQueue,
            webhookQueue,
            appConfig,
            keycloakService,
            formWizardPdfGenerator,
            formPdfGenerator
        )
    });

    const settings = {
        'grant_type': 'client_credentials',
    };

    it ('can handle version url', async() => {
        const job: SubstituteOf<Job> = Substitute.for<Job>();

        keycloakService.getAccessToken().returns(Promise.resolve('access-token-generated'))
        nock('http://localhost:3241', {
            reqheaders: {
                'Authorization' : 'Bearer access-token-generated'
            }
        }).log(console.log)
            .get('/form/version/1234132')
            .reply(200, {
                schema: {
                    name: 'apples',
                    display: 'form',
                    components: [{
                        key: 'name'
                    }]
                }
            });

        job.data.returns({
            formUrl: 'http://localhost:3241/form/version/1234132',
            webhookUrl: 'test',
            submission: {
                data: {
                    name: 'test'
                }
            }
        });

        formPdfGenerator.generatePdf(Arg.any(), Arg.any()).returns(Promise.resolve({
            message: 'test',
            fileLocation: 'fileLocation',
            etag: 'etag',
            fileName: 'fileName'
        }));

        const webhookJob: SubstituteOf<Job<WebhookJob>> = Substitute.for<Job<WebhookJob>>();

        webhookQueue.add(Arg.all()).returns(Promise.resolve(webhookJob));
        const result: Promise<Job<WebhookJob>> = await pdfProcessor.handlePdf(job);
        expect(result).to.be.not.null;


    });
    it ('can handle non version url', async() => {
        const job: SubstituteOf<Job> = Substitute.for<Job>();

        keycloakService.getAccessToken().returns(Promise.resolve('access-token-generated'))
        nock('http://localhost:3241', {
            reqheaders: {
                'Authorization' : 'Bearer access-token-generated'
            }
        }).log(console.log)
            .get('/form/name/apples')
            .reply(200, {
                name: 'apples',
                display: 'form',
                components: [{
                    key: 'name'
                }]
            });

        job.data.returns({
            formUrl: 'http://localhost:3241/form/name/apples',
            webhookUrl: 'test',
            submission: {
                data: {
                    name: 'test'
                }
            }
        });

        formPdfGenerator.generatePdf(Arg.any(), Arg.any()).returns(Promise.resolve({
            message: 'test',
            fileLocation: 'fileLocation',
            etag: 'etag',
            fileName: 'fileName'
        }));

        const webhookJob: SubstituteOf<Job<WebhookJob>> = Substitute.for<Job<WebhookJob>>();

        webhookQueue.add(Arg.all()).returns(Promise.resolve(webhookJob));
        const result: Promise<Job<WebhookJob>> = await pdfProcessor.handlePdf(job);
        expect(result).to.be.not.null;


    });

    it('can handle successful pdf', async () => {
        const job: SubstituteOf<Job> = Substitute.for<Job>();

        job.data.returns({
            formSchema: {
                name: 'name',
                display: 'form',
                components: [{
                    key: 'name'
                }]
            },
            webhookUrl: 'test',
            submission: {
                data: {
                    name: 'test'
                }
            }
        });

        formPdfGenerator.generatePdf(Arg.any(), Arg.any()).returns(Promise.resolve({
            message: 'test',
            fileLocation: 'fileLocation',
            etag: 'etag',
            fileName: 'fileName'
        }));

        const webhookJob: SubstituteOf<Job<WebhookJob>> = Substitute.for<Job<WebhookJob>>();

        webhookQueue.add(Arg.all()).returns(Promise.resolve(webhookJob));
        const result: Promise<Job<WebhookJob>> = await pdfProcessor.handlePdf(job);
        expect(result).to.be.not.null;
    });


    it('can handle successful pdf for wizard', async () => {
        const job: SubstituteOf<Job> = Substitute.for<Job>();

        job.data.returns({
            formSchema: {
                name: 'name',
                display: 'wizard',
                components: [{
                    key: 'name'
                }]
            },
            webhookUrl: 'test',
            submission: {
                data: {
                    name: 'test'
                }
            }
        });

        formWizardPdfGenerator.generatePdf(Arg.any(), Arg.any()).returns(Promise.resolve({
            message: 'test',
            fileLocation: 'fileLocation',
            etag: 'etag',
            fileName: 'fileName'
        }));

        const webhookJob: SubstituteOf<Job<WebhookJob>> = Substitute.for<Job<WebhookJob>>();

        webhookQueue.add(Arg.all()).returns(Promise.resolve(webhookJob));
        const result: Promise<Job<WebhookJob>> = await pdfProcessor.handlePdf(job);
        expect(result).to.be.not.null;
    });
});
