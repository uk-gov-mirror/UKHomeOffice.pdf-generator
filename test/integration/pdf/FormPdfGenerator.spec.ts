import 'reflect-metadata';
import {expect} from "chai"
import AppConfig from "../../../src/interfaces/AppConfig";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {FormTemplateResolver} from "../../../src/pdf/FormTemplateResolver";
import {S3Service} from "../../../src/service/S3Service";
import {Arg, Substitute} from "@fluffy-spoon/substitute";
import {FormPdfGenerator} from "../../../src/pdf/FormPdfGenerator";
import {basicForm} from "../../form";

describe('FormPdfGenerator', () => {

    const appConfig: AppConfig = defaultAppConfig;
    let formTemplateResolver: FormTemplateResolver;
    let s3Service: S3Service;
    let formPdfGenerator: FormPdfGenerator;

    beforeEach(() => {
        formTemplateResolver = new FormTemplateResolver();
        s3Service = Substitute.for<S3Service>();
        formPdfGenerator = new FormPdfGenerator(appConfig, formTemplateResolver, s3Service);
    });

    it('can generate pdf', async () => {
        const formSchema = basicForm;
        const submission = {
            "data": {
                "textField": "randomValue"
            }
        };

        // @ts-ignore
        s3Service.upload(Arg.any(), Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve({
            location: 'test',
            etag: 'etag'
        }));

        const result = await formPdfGenerator.generatePdf(formSchema, submission);

        expect(result.fileLocation).to.be.eq('test');
        expect(result.message).to.be.eq('Form testAbc successfully created and uploaded to file store');

    }).timeout(20000);
});
