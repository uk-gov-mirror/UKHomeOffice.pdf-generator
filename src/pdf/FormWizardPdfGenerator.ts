import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {PdfGenerator} from './PdfGenerator';
import util from 'formiojs/utils';
import puppeteer from 'puppeteer';
import logger from '../util/logger';
import merge from 'easy-pdf-merge';
import _ from 'lodash';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import {FormTemplateResolver} from './FormTemplateResolver';
import InternalServerError from '../error/InternalServerError';
import {S3Service} from '../service/S3Service';
import cluster from 'cluster';

@provide(TYPE.FormWizardPdfGenerator)
export class FormWizardPdfGenerator extends PdfGenerator {

    constructor(@inject(TYPE.AppConfig) appConfig: AppConfig,
                @inject(TYPE.FormTemplateResolver) formTemplateResolver: FormTemplateResolver,
                @inject(TYPE.S3Service) s3Service: S3Service) {
        super(appConfig, formTemplateResolver, s3Service);

    }

    public async generatePdf(schema: any, formSubmission: any): Promise<{
        fileLocation: string,
        message: string,
        etag: string,
        fileName: string,
    }> {
        const formName = schema.name;

        const mergeMultiplePDF = (files: string[], finalFileName: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const location: string = `/tmp/${finalFileName}`;

                merge(files, location, (err) => {
                    if (err) {
                        logger.error('PDF merge failed', err);
                        reject(err);
                    }
                    resolve(location);
                });
            });
        };

        const panels: any[] = util.searchComponents(schema.components, {
            type: 'panel',
        });

        let fileLocation: string = null;
        let pdfFiles: string[] = [];
        const finalPdfName = this.finalPdfName(formSubmission, schema);
        try {
            pdfFiles = await puppeteer.launch({
                headless: true,
                args: ['--unlimited-storage',
                    '--ignore-certificate-errors',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'],
            }).then(async (browser) => {
                const promises = [];
                _.forEach(panels, async (panel, index) => {
                    promises.push(browser.newPage().then(async (page) => {
                        panel.conditional = {eq: 'yes', show: 'true', when: null};
                        const newSchema: any = {
                            name: schema.name,
                            display: 'form',
                            title: schema.title,
                            path: schema.path,
                            components: [panel],
                        };
                        const htmlContent = await this.formTemplateResolver
                            .renderContentAsHtml(newSchema, formSubmission);

                        const tempFileName = `/tmp/${finalPdfName}-${index}`;

                        const htmlFileName = `${tempFileName}.html`;

                        const result = await this.writeFilePromise(htmlFileName, htmlContent);
                        logger.debug(result);

                        const tempPath = `${tempFileName}.pdf`;
                        try {
                            page.setDefaultTimeout(0);

                            page.on('error', (error) => {
                                logger.error(`Page error detected at ${tempPath}`, {
                                    error: error.message,
                                    cluster: {
                                        workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                                    },
                                });
                            });

                            await page.goto(`file://${htmlFileName}`,
                                {waitUntil: ['networkidle0', 'load', 'domcontentloaded'], timeout: 0});

                            await page.pdf({path: tempPath, format: 'A4'});

                            logger.info(`${tempFileName}.pdf created`, {
                                cluster: {
                                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                                },
                            });

                            return tempPath;
                        } catch (e) {

                            logger.error(e.message);
                            const errorPagePath = `/tmp/${tempFileName}-error.png`;
                            await page.screenshot({path: errorPagePath});

                            await this.s3Service.uploadError(this.appConfig.aws.s3.buckets.pdf,
                                errorPagePath, `${tempFileName}-error.png`);
                            logger.info('Uploaded error page', {
                                cluster: {
                                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                                },
                            });

                            await this.deleteFile(errorPagePath);
                            return tempPath;
                        }
                    }));
                });
                const files = await Promise.all(promises);
                browser.close();
                return files;
            });

            logger.info(`PDF files ${pdfFiles.length}`);

            const finalFileName = `${finalPdfName}.pdf`;

            logger.info(`Performing final merge for ${finalFileName}`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                },
            });

            const updatedPdfFiles: string[] = await this.filterBlankPdfFiles(pdfFiles);

            fileLocation = await mergeMultiplePDF(updatedPdfFiles, `${finalFileName}`);
            logger.info(`Merge completed for ${finalFileName}`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                },
            });

            const s3Location = await this.s3Service.uploadFile(this.bucketName, fileLocation,
                finalFileName);

            logger.info(`S3 etag ${s3Location}`, {
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                },
            });

            return {
                fileName: finalFileName,
                fileLocation: s3Location.location,
                etag: s3Location.etag,
                message: `Form ${formName} successfully created and uploaded to file store`,
            };
        } catch (e) {
            logger.error('An exception occurred ', {
                error: e.message,
                cluster: {
                    workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                },
            });
            throw new InternalServerError(e);

        } finally {
            if (pdfFiles.length !== 0) {
                logger.info('Deleting temp files created', {
                    cluster: {
                        workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                    },
                });
                _.forEach(pdfFiles, async (file) => {
                    await this.deleteFile(file);
                    await this.deleteFile(file.replace('.pdf', '.html'));
                });
            }
            if (fileLocation) {
                await this.deleteFile(fileLocation);
            }
        }
    }

    private async filterBlankPdfFiles(pdfFiles: string[]): Promise<string[]> {
        return pdfFiles;
    }
}
