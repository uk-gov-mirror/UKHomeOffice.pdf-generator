import 'reflect-metadata';
import {expect} from "chai"
import AppConfig from "../../../src/interfaces/AppConfig";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {FormTemplateResolver} from "../../../src/pdf/FormTemplateResolver";
import {S3Service} from "../../../src/service/S3Service";
import {Arg, Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {wizardForm} from "../../form";
import {FormWizardPdfGenerator} from "../../../src/pdf/FormWizardPdfGenerator";


describe('FormWizardPdfGenerator', () => {

    const appConfig: AppConfig = defaultAppConfig;
    let formTemplateResolver: FormTemplateResolver;
    let s3Service: SubstituteOf<S3Service>;
    let formWizardPdfGenerator: FormWizardPdfGenerator;

    beforeEach(() => {
        formTemplateResolver = new FormTemplateResolver();
        s3Service = Substitute.for<S3Service>();
        formWizardPdfGenerator = new FormWizardPdfGenerator(appConfig, formTemplateResolver, s3Service);
    });

    it('can generate pdf', async () => {
        const formSchema = wizardForm;
        const submission = {
            "data": {
                "textField": "AA",
                "textField1": "AA"
            }
        };

        const id = 'id';
        s3Service.uploadFile(Arg.any(), Arg.any(), Arg.any(), Arg.any()).returns(Promise.resolve(id));

        const result = await formWizardPdfGenerator.generatePdf(formSchema, submission);

        expect(result.fileLocation).to.be.eq(id);
        expect(result.message).to.be.eq('Form wizard successfully created and uploaded to file store');

    }).timeout(20000);
});
