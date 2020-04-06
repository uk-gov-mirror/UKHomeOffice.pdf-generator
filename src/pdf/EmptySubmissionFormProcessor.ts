import * as util from 'formiojs/utils/formUtils';
import JSONPath from 'jsonpath';
import _ from 'lodash';
import logger from '../util/logger';

export class EmptySubmissionFormProcessor {

    public processEmptyContent(schema: any, submission: any): any[] {
        const cleanedPanels = new Set();
        const panels: any[] = util.searchComponents(schema.components, {
            type: 'panel',
        });

        this.handleEmptyData(panels, submission, cleanedPanels);
        return Array.from(cleanedPanels);
    }

    private handleEmptyData(panels: any[], submission: any, cleanedPanels): void {
        panels.forEach((panel) => {
            util.eachComponent(panel.components, (component, path) => {
                if (component.type === 'panel') {
                    component.customClass += ' page';
                }
                if (!path) {
                    return;
                }
                const jsonPath = `$.${path}`;
                try {
                    const data = JSONPath.value(submission.data ? submission.data : {}, jsonPath);
                    if (Array.isArray(data)) {
                        data.map((item) => {
                            this.handleEmptyData(component.components, item, cleanedPanels);
                        });
                    } else {
                        if (!_.isEmpty(data)) {
                            cleanedPanels.add(panel);
                        }
                    }
                } catch (e) {
                    logger.error(e);
                }

            });
        });
    }
}
