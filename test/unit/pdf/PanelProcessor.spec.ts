import 'reflect-metadata';
import {expect} from "chai";
import {EmptySubmissionFormProcessor} from "../../../src/pdf/EmptySubmissionFormProcessor";
import {wizardForm} from "../../form";

describe('EmptySubmissionFormProcessor', () => {
    it('can process empty content', () => {
        const panelProcessor = new EmptySubmissionFormProcessor();

        const submission = {
            "data": {
                "textField": "AA",
                "textField1": ""
            }
        };
        const updatedPanels = panelProcessor.processEmptyContent(wizardForm, submission);

        expect(updatedPanels.length).to.be.eq(1);
    });
});
