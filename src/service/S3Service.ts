import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import AppConfig from '../interfaces/AppConfig';
import {Client} from 'minio';
import logger from '../util/logger';

@provide(TYPE.S3Service)
export class S3Service {
    private readonly minioClient: Client;
    private readonly s3Url: string;

    constructor(@inject(TYPE.AppConfig) private readonly appConfig: AppConfig) {
        const s3: {
            endpoint: string,
            useSSL: boolean,
            port: number,
            accessKey: string,
            secretKey: string,
        } = this.appConfig.aws.s3;
        this.minioClient = new Client({
            endPoint: s3.endpoint,
            useSSL: s3.useSSL,
            port: s3.port,
            accessKey: s3.accessKey,
            secretKey: s3.secretKey,
        });
        this.s3Url = this.appConfig.aws.s3.protocol +
            this.appConfig.aws.s3.endpoint + '/' + this.appConfig.aws.s3.buckets.pdf;

    }

    public async upload(bucketName: string,
                        file: Buffer,
                        objectName: string,
                        metaData?: object): Promise<string> {
        return new Promise((resolve, reject) => {
            this.minioClient.putObject(bucketName, objectName, file, file.length,
                metaData,
                (err, etag) => {
                    if (err) {
                        reject(err);
                    } else {
                        logger.info(`Successfully ${objectName} uploaded to S3`, {
                            etag,
                        });
                        resolve(`${this.s3Url}/${objectName}`);
                    }
                });
        });
    }

    public async uploadFile(bucketName: string,
                            filePath: string,
                            objectName: string,
                            metaData?: object): Promise<string> {
        return new Promise((resolve, reject) => {
            this.minioClient.fPutObject(bucketName, objectName, filePath,
                metaData,
                (err, etag) => {
                    if (err) {
                        reject(err);
                    } else {
                        logger.info(`Successfully ${objectName} uploaded to S3`, {
                            etag,
                        });
                        resolve(`${this.s3Url}/${objectName}`);
                    }
                });
        });
    }

}
