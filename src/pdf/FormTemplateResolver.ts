import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import formTemplate from './formTemplate';
import utils from 'formiojs/utils';
import logger from '../util/logger';
import ejs from 'ejs';

@provide(TYPE.FormTemplateResolver)
export class FormTemplateResolver {

    public async renderContentAsHtml(formSchema: object, submission: object): Promise<string> {
        const sanitizedFormSchema = this.sanitize(formSchema);

        const template = ejs.compile(formTemplate, {});
        const parsedContent = template({
            formSchema: sanitizedFormSchema,
            submission,
        });

        return Promise.resolve(parsedContent);
    }

    private sanitize(formSchema: any): object {
        utils.eachComponent(formSchema.components, (component: any) => {
            if (component.type === 'button') {
                component.hidden = true;
                logger.info(`Removing button for ${component.key}`);
            }
            if (component.type === 'datagrid') {
                component.disableAddingRemovingRows = true;
                component.defaultOpen = true;
            }
            if (component.type === 'select') {
                component.lazyLoad = false;
            }
            if (component.type === 'panel') {
                component.collapsed = false;
            }
        }, true);
        return formSchema;
    }
}
