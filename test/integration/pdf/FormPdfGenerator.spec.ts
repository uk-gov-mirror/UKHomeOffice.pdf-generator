import 'reflect-metadata';
import {expect} from 'chai';
import AppConfig from '../../../src/interfaces/AppConfig';
import defaultAppConfig from '../../../src/config/defaultAppConfig';
import {FormTemplateResolver} from '../../../src/pdf/FormTemplateResolver';
import {S3Service} from '../../../src/service/S3Service';
import {Arg, Substitute, SubstituteOf} from '@fluffy-spoon/substitute';
import {FormPdfGenerator} from '../../../src/pdf/FormPdfGenerator';
import {basicForm} from '../../form';
import {KeycloakService} from '../../../src/service/KeycloakService';

describe('FormPdfGenerator', () => {

    const appConfig: AppConfig = defaultAppConfig;
    let formTemplateResolver: FormTemplateResolver;
    let s3Service: SubstituteOf<S3Service>;
    let formPdfGenerator: FormPdfGenerator;
    let keycloakService: SubstituteOf<KeycloakService>;

    let server;

    beforeEach(() => {
        keycloakService = Substitute.for<KeycloakService>();
        formTemplateResolver = new FormTemplateResolver(keycloakService);
        s3Service = Substitute.for<S3Service>();
        formPdfGenerator = new FormPdfGenerator(appConfig, formTemplateResolver, s3Service);
    });

    before(() => {
        const express = require('express');
        const app = express();
        app.use('/tmp', express.static('/tmp/'));
        // tslint:disable-next-line:no-magic-numbers
        server = app.listen(3000, () => {
            const port = server.address().port;
            // tslint:disable-next-line:no-console
            console.log('Example app listening at port %s', port);
        });
    });

    after((done) => {
        server.close(() => {
            // tslint:disable-next-line:no-console
            console.log('Server closed');
            done();
        });
    });

    it('can generate pdf', async () => {
        const formSchema = basicForm;
        const submission = {
            data: {
                textField: 'randomValue',
            },
        };

        keycloakService.getAccessToken().returns(Promise.resolve('token'));
        s3Service.upload(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve({
            location: 'test',
            etag: 'etag',
            fileName: 'fileName',
        }));

        const result = await formPdfGenerator.generatePdf(formSchema, submission);

        expect(result.fileLocation).to.be.eq('test');
        expect(result.message).to.be.eq('Form testAbc successfully created and uploaded to file store');

    }).timeout(20000);
});
