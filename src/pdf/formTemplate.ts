const template = `<!doctype html>
<html lang="en">

<style type="text/css" media="print">
     .govuk-input,
     .govuk-select,
     .govuk-checkboxes_item,
     .govuk-checkboxes,
     .govuk-date-input,
     .govuk-radios {
        page-break-inside: avoid;
      }
    body {
      overscroll-behavior-y: none;
      font-family: "nta", Arial, sans-serif;
     }
     .govuk-textarea div {
        white-space: pre-wrap;
     }
}
</style>
    <link rel="stylesheet" href="/node_modules/bootstrap/dist/css/bootstrap.css">
    <link rel="stylesheet" href="/node_modules/formiojs/dist/formio.full.min.css">
    <script src="/node_modules/axios/dist/axios.js"></script>

    <script src="/node_modules/formiojs/dist/formio.full.js"></script>
    <script src="/node_modules/@digitalpatterns/formio-gds-template/dist/gds.js"></script>
    <script type='text/javascript'>
      window.onload = function() {
       Formio.use(gds);
       Formio.plugins = [{
        priority: 0,
        preRequest: async function (requestArgs) {
            if (!requestArgs.opts) {
                requestArgs.opts = {};
            }
            if (!requestArgs.opts.header) {
                requestArgs.opts.header = new Headers();
                if (requestArgs.method !== 'upload') {
                    requestArgs.opts.header.set('Accept', 'application/json');
                    requestArgs.opts.header.set('Content-type', 'application/json; charset=UTF-8');
                } else {
                    requestArgs.opts.header.set('Content-type', requestArgs.file.type);
                }
            }
            requestArgs.opts.header.set('Authorization', 'Bearer <%= token %>');
            if (!requestArgs.url) {
                requestArgs.url = "";
            }
            requestArgs.url = requestArgs.url.replace("_id", "id");
            return requestArgs;
        },
    },{
            priority: 0,
            requestResponse: function (response) {
                return {
                    ok: response.ok,
                    json: () => response.json().then((result) => {
                        if (result.forms) {
                            return result.forms.map((form) => {
                                form['_id'] = form.id;
                                return form;
                            });
                        }
                        result['_id'] = result.id;
                        return result;
                    }),
                    status: response.status,
                    headers: response.headers
                };

            }
        }]


       Formio.createForm(document.getElementById('formio'),  <%- JSON.stringify(formSchema) %>, {
            readOnly: true,
       }).then(function(form) {
           form.submission =  <%- JSON.stringify(submission) %>
           form.on('componentError', function(error) {
             var formName = form._form ? form._form.name : '';
              var log = {
                 'level': 'error',
                 'message': error.message,
                  'form': formName,
                    'component': {
                        'label': error.component.label,
                        'key': error.component.key
                    }
              }
              axios.post('/log', [log], {
                'Content-Type': 'application/json'
              })

           });
        });
      };

    </script>
  <body>
    <div id='formio' class="container"></div>
  </body>
</html>`;

export default template;
