import {controller, httpPost, request, requestBody, response} from 'inversify-express-utils';
import * as express from 'express';
import HttpStatusCode from 'http-status-codes';
import TYPE from '../constant/TYPE';
import logger from '../util/logger';

@controller('')
export class LogController {

    @httpPost('/log')
    public async log(@request() req: express.Request,
                     @response() res: express.Response): Promise<void> {
        const logStatements = req.body;
        logStatements.forEach((log) => {
            logger.log(log);
        });
        res.sendStatus(HttpStatusCode.OK);
    }
}
