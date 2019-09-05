import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import logger from '../util/logger';
import * as fs from 'fs';
import S3 from 'aws-sdk/clients/s3';
import cluster from 'cluster';

@provide(TYPE.S3Service)
export class S3Service {
    private readonly s3Url: string;
    private readonly s3Config: {
        endpoint: string,
        useSSL: boolean,
        port: number,
        accessKey: string,
        secretKey: string,
        kmsKey: string,
        region: string,
    };

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig,
                @inject(TYPE.S3) private readonly s3: S3) {
        this.s3Config = this.appConfig.aws.s3;

        this.s3Url = this.appConfig.aws.s3.protocol +
            this.appConfig.aws.s3.endpoint + '/' + this.appConfig.aws.s3.buckets.pdf;

    }

    public async uploadError(bucketName: string, filePath: string, key: string) {
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: fs.readFileSync(filePath),
            ContentType: 'image/png',
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: this.s3Config.kmsKey,
        };
        return this.uploadToS3(params);
    }
    public async upload(bucketName: string,
                        file: Buffer,
                        objectName: string): Promise<{ location, etag }> {

        const params = {
            Bucket: bucketName,
            Key: objectName,
            Body: file,
            ContentType: 'application/pdf',
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: this.s3Config.kmsKey,
        };

        return this.uploadToS3(params);
    }

    public async uploadFile(bucketName: string,
                            filePath: string,
                            objectName: string): Promise<{ location, etag }> {

        const params = {
            Bucket: bucketName,
            Key: objectName,
            Body: fs.readFileSync(filePath),
            ContentType: 'application/pdf',
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: this.s3Config.kmsKey,
        };

        return this.uploadToS3(params);
    }

    private uploadToS3(params): Promise<{ location, etag }> {
        return new Promise((resolve, reject) => {
            this.s3.putObject(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    const etag = data.ETag.replace(/(^"|"$)/g, '');
                    logger.info(`Successfully ${params.Key} uploaded to S3`, {
                        etag,
                        cluster: {
                            workerId: cluster.worker ? cluster.worker.id : 'non-cluster',
                        },
                    });
                    resolve({
                        location: `${this.s3Url}/${params.Key}`,
                        etag,
                    });
                }
            });
        });
    }
}
