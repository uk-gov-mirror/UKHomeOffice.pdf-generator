import 'reflect-metadata';
import {expect} from "chai"
import AppConfig from "../../../src/interfaces/AppConfig";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {FormTemplateResolver} from "../../../src/pdf/FormTemplateResolver";
import {S3Service} from "../../../src/service/S3Service";
import {Arg, Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {wizardForm} from "../../form";
import {FormWizardPdfGenerator} from "../../../src/pdf/FormWizardPdfGenerator";
import {KeycloakService} from "../../../src/service/KeycloakService";



describe('FormWizardPdfGenerator', () => {
    let server;
    const appConfig: AppConfig = defaultAppConfig;
    let formTemplateResolver: FormTemplateResolver;
    let s3Service: SubstituteOf<S3Service>;
    let formWizardPdfGenerator: FormWizardPdfGenerator;
    let keycloakService: SubstituteOf<KeycloakService>;

    before(() => {
        const express = require('express');
        const app = express();
        app.use('/tmp', express.static('/tmp/'));
        server = app.listen(3000, function () {
            const port = server.address().port;
            console.log('Example app listening at port %s', port);
        });
    });

    after((done) => {
        server.close(() => {
            console.log("Server closed");
            done();
        })
    });
    beforeEach(() => {
        keycloakService = Substitute.for<KeycloakService>();
        formTemplateResolver = new FormTemplateResolver(keycloakService);
        s3Service = Substitute.for<S3Service>();
        formWizardPdfGenerator = new FormWizardPdfGenerator(appConfig, formTemplateResolver, s3Service);
    });

    it('can generate pdf', async () => {
        const formSchema = wizardForm;
        const submission = {
            "data": {
                "textField": "AA",
                "textField1": "AA1"
            }
        };

        const id = 'id';

        keycloakService.getAccessToken().returns(Promise.resolve('token'));

        s3Service.uploadFile(Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve({
            location: id,
            etag: 'etag',
            fileName: 'fileName'
        }));

        const result = await formWizardPdfGenerator.generatePdf(formSchema, submission);

        expect(result.fileLocation).to.be.eq(id);
        expect(result.message).to.be.eq('Form wizard successfully created and uploaded to file store');

    }).timeout(20000);
});
