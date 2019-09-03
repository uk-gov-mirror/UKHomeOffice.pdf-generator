import 'reflect-metadata';
import 'mocha';
import {ApplicationContext} from "../../src/container/ApplicationContext";
import TYPE from "../../src/constant/TYPE";
import {cleanUpMetadata} from "inversify-express-utils";
import {Queue} from "bull";
import {PdfJob} from "../../src/model/PdfJob";

import * as createQueueModule from "../../src/queues/createQueue";
import {ImportMock} from 'ts-mock-imports';
import {Substitute} from "@fluffy-spoon/substitute";

ImportMock.mockFunction(createQueueModule, "default", Substitute.for<Queue>());

export const applicationContext: ApplicationContext = new ApplicationContext();

beforeEach(() => {
    cleanUpMetadata();
});

before(async () => {
    process.env.NODE_ENV = "test";
});

afterEach(async () => {
    const pdfQueue: Queue<PdfJob> = applicationContext.get(TYPE.PDFQueue);
    await pdfQueue.close();
});
