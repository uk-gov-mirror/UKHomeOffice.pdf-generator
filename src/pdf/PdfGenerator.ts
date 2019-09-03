import * as fs from 'fs';
import AppConfig from '../interfaces/AppConfig';
import {FormTemplateResolver} from './FormTemplateResolver';
import {injectable} from 'inversify';
import moment from 'moment';
import {S3Service} from '../service/S3Service';

@injectable()
export abstract class PdfGenerator {

    protected readonly bucketName: string;

    protected readonly appConfig: AppConfig;

    protected readonly formTemplateResolver: FormTemplateResolver;

    protected readonly s3Service: S3Service;

    protected constructor(appConfig: AppConfig,
                          formTemplateResolver: FormTemplateResolver,
                          s3Service: S3Service) {
        this.appConfig = appConfig;
        this.formTemplateResolver = formTemplateResolver;
        this.s3Service = s3Service;
        this.bucketName = this.appConfig.aws.s3.buckets.pdf;

    }

    public abstract async generatePdf(schema: any, formSubmission: any):
        Promise<{ fileLocation: string, message: string, etag: string, fileName: string}>;

    protected finalPdfName(submission: any, schema: any): string {
        return submission.data.businessKey ?
            `${schema.name}-${submission.data.businessKey}-${moment().format('YYMMDDHHmmss')}` :
            `${schema.name}-${moment().format('YYMMDDHHmmss')}`;
    }

    protected async deleteFile(file: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.unlink(file, (error) => {
                if (error) {
                    reject(error);
                }
                resolve(`file ${file} successfully deleted`);
            });
        });
    }

    protected async writeFilePromise(file: string, data: any): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, data, (error) => {
                if (error) {
                    reject(error);
                }
                resolve(`${file} successfully created`);
            });
        });
    }
}
