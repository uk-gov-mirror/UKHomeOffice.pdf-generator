import 'reflect-metadata';
import {expect} from "chai";
import * as AWS from "aws-sdk";
import * as AWSMock from "aws-sdk-mock";
import {S3Service} from "../../../src/service/S3Service";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {PutObjectRequest} from "aws-sdk/clients/mediastoredata";
import fs from 'fs';

AWS.config.paramValidation = false;

describe('S3Service', () => {

    it('can upload a buffer', async () => {
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('S3', 'putObject', (params: PutObjectRequest, callback: Function) => {
            callback(null, {
                ETag: "\"0d4f88feff519a90253ee5c5197feff3\""
            })
        });
        const s3Service = new S3Service(defaultAppConfig, new AWS.S3());

        const buffer = Buffer.from('test');
        const result = await s3Service.upload("bucket", buffer, 'id');
        expect(result.etag).to.be.eq('0d4f88feff519a90253ee5c5197feff3');
        AWSMock.restore('S3');
    });

    it('can upload file', async() => {

        fs.writeFileSync("/tmp/apples.pdf", {});

        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('S3', 'putObject', (params: PutObjectRequest, callback: Function) => {
            callback(null, {
                ETag: "\"0d4f88feff519a90253ee5c5197feff3\""
            })
        });
        const s3Service = new S3Service(defaultAppConfig, new AWS.S3());
        const result = await s3Service.uploadFile("bucket", '/tmp/apples.pdf', 'apples.pdf');
        expect(result.etag).to.be.eq('0d4f88feff519a90253ee5c5197feff3');
        AWSMock.restore('S3');

    })
});
