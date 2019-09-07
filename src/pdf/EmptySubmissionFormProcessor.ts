import util from 'formiojs/utils';
import JSONPath from 'jsonpath';
import _ from 'lodash';

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
                if (!path) {
                    return;
                }
                const jsonPath = `$.${path}`;
                const data = JSONPath.value(submission.data, jsonPath);
                if (Array.isArray(data)) {
                    data.map((item) => {
                        this.handleEmptyData(component.components, item, cleanedPanels);
                    });
                } else {
                    if (!_.isEmpty(data)) {
                        cleanedPanels.add(panel);
                    }
                }
            });
        });
    }
}
