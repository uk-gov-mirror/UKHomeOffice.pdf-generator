import {expect} from "chai";
import {FormTemplateResolver} from "../../../src/pdf/FormTemplateResolver";
import {basicForm} from "../../form";
import {Substitute, SubstituteOf} from "@fluffy-spoon/substitute";
import {S3Service} from "../../../src/service/S3Service";
import {FormPdfGenerator} from "../../../src/pdf/FormPdfGenerator";
import {KeycloakService} from "../../../src/service/KeycloakService";

describe('FormTemplateResolver', () => {

    let formTemplateResolver: FormTemplateResolver;
    let s3Service: SubstituteOf<S3Service>;
    let formPdfGenerator: FormPdfGenerator;
    let keycloakService: SubstituteOf<KeycloakService>;

    beforeEach(() => {
        keycloakService = Substitute.for<KeycloakService>();
        formTemplateResolver = new FormTemplateResolver(keycloakService);
    });

    it('can generate html', async () => {

        keycloakService.getAccessToken().returns(Promise.resolve('token'));
        const result = await formTemplateResolver.renderContentAsHtml(basicForm, {
            data: {
                "textField": "This is a test of data"
            }
        });
        console.log(result);
        expect(result).to.be.not.null;
    });
});
