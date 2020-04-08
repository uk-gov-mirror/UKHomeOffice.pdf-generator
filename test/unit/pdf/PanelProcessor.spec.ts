import 'reflect-metadata';
import {expect} from 'chai';
import {EmptySubmissionFormProcessor} from '../../../src/pdf/EmptySubmissionFormProcessor';
import {dataGridWizard, sampleForm, wizardForm} from '../../form';

describe('EmptySubmissionFormProcessor', () => {
    it('can process empty content', () => {
        const panelProcessor = new EmptySubmissionFormProcessor();

        const submission = {
            data: {
                textField: 'AA',
                textField1: '',
            },
        };
        const updatedPanels = panelProcessor.processEmptyContent(wizardForm, submission);

        expect(updatedPanels.length).to.be.eq(1);
    });

    it('can process null data', () => {
        const panelProcessor = new EmptySubmissionFormProcessor();
        const submission = {
            data: {
                textField: 'AA',
                aviationPassengerCrewContainer: {
                    checkbox: false,
                    aviationPassengerCrewGrid: [{
                        aviationPassengerCrew_crewRole: {},
                        aviationPassengerCrew_surname: 'aa',
                        aviationPassengerCrew_forename: '',
                        aviationPassengerCrew_dob: '00/00/0000',
                        aviationPassengerCrew_sex: {},
                        aviationPassengerCrew_passportIDNum: '',
                        aviationPassengerCrew_nationality: {},
                        aviationPassengerCrew_addressLine1: '',
                        aviationPassengerCrew_addressLine2: '',
                        aviationPassengerCrew_addressLine3: '',
                        aviationPassengerCrew_townCity: '',
                        aviationPassengerCrew_postcode: '',
                        aviationPassengerCrew_country: {},
                        aviationPassengerCrew_phoneNumber: '',
                        aviationPassengerCrew_validVisaRad: '',
                    }],
                },
            },

        };
        const updatedPanels = panelProcessor.processEmptyContent(sampleForm, submission);

        expect(updatedPanels.length).to.be.eq(2);
    });

    it('can produce panels for data grid', () => {
        const panelProcessor = new EmptySubmissionFormProcessor();

        const submission = {
            data: {
                textField: 'apples',
                dataGrid: [
                    {
                        textField: 'Apples',
                    },
                    {
                        textField: 'Bananas',
                    },
                ],
            },
        };
        const updatedPanels = panelProcessor.processEmptyContent(dataGridWizard, submission);

        expect(updatedPanels.length).to.be.eq(2);
    });
});
