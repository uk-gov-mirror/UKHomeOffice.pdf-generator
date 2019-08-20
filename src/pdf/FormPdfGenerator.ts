import TYPE from '../constant/TYPE';
import {provide} from 'inversify-binding-decorators';
import {PdfGenerator} from './PdfGenerator';
import logger from '../util/logger';
import puppeteer from 'puppeteer';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import {FormTemplateResolver} from './FormTemplateResolver';
import InternalServerError from '../error/InternalServerError';
import {S3Service} from '../service/S3Service';

@provide(TYPE.FormPdfGenerator)
export class FormPdfGenerator extends PdfGenerator {

    constructor(@inject(TYPE.AppConfig) appConfig: AppConfig,
                @inject(TYPE.FormTemplateResolver) formTemplateResolver: FormTemplateResolver,
                @inject(TYPE.S3Service) s3Service: S3Service) {
        super(appConfig, formTemplateResolver, s3Service);

    }

    public async generatePdf(schema: any, formSubmission: any): Promise<{
        fileLocation: string,
        message: string,
    }> {
        logger.info('Generating pdf for form');
        const formName = schema.name;
        const finalPdfName = this.finalPdfName(formSubmission, schema);

        const tempHtmlFile = `/tmp/${finalPdfName}.html`;

        const htmlContent = await this.formTemplateResolver.renderContentAsHtml(schema,
            formSubmission);
        const result = await this.writeFilePromise(tempHtmlFile, htmlContent);

        logger.debug(`${result}`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--disable-web-security'],
        });

        logger.debug('Opened browser for creating PDF');
        const page = await browser.newPage();

        try {
            await page.goto(`file://${tempHtmlFile}`,
                {waitUntil: ['networkidle0', 'load', 'domcontentloaded'], timeout: 0});

            const pdf = await page.pdf({format: 'A4'});

            logger.info(`PDF generated for ${formName}...now uploading to file store.`);

            const fileLocation = await this.s3Service.upload(this.bucketName, pdf, `${finalPdfName}.pdf`,
                this.pdfMetaData);

            logger.info(`File location ${fileLocation}`);

            return {
                fileLocation,
                message: `Form ${formName} successfully created and uploaded to file store`,
            };

        } catch (e) {
            logger.error('An exception occurred ', e);
            throw new InternalServerError(e);
        } finally {
            if (page !== null) {
                await page.close();
            }
            if (browser !== null) {
                await browser.close();
                logger.debug('Browser closed');
            }
            await this.deleteFile(tempHtmlFile);
        }
    }
}
