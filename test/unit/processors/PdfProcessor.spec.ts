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
            fileLocation: 'fileLocation'
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
            fileLocation: 'fileLocation'
        }));

        const webhookJob: SubstituteOf<Job<WebhookJob>> = Substitute.for<Job<WebhookJob>>();

        webhookQueue.add(Arg.all()).returns(Promise.resolve(webhookJob));
        const result: Promise<Job<WebhookJob>> = await pdfProcessor.handlePdf(job);
        expect(result).to.be.not.null;
    });
});
