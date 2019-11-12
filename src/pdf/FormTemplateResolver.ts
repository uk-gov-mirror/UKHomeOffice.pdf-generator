import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import utils from 'formiojs/utils';
import logger from '../util/logger';
import ejs from 'ejs';
import {inject} from 'inversify';
import {KeycloakService} from '../service/KeycloakService';
import formTemplate from './formTemplate';

@provide(TYPE.FormTemplateResolver)
export class FormTemplateResolver {

    constructor(@inject(TYPE.KeycloakService) private readonly keycloakService: KeycloakService) {
    }

    public async renderContentAsHtml(formSchema: object, submission: object): Promise<string> {
        const sanitizedFormSchema = this.sanitize(formSchema);
        const token = await this.keycloakService.getAccessToken();
        const template = ejs.compile(formTemplate, {});
        const parsedContent = template({
            formSchema: sanitizedFormSchema,
            submission,
            token,
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
                component.hidden = false;
            }
        }, true);
        return formSchema;
    }
}
