const template = `<!doctype html>
<html lang="en">

<style type="text/css" media="print">
      div.page
      {
        page-break-after: always;
        page-break-inside: avoid;
      }

</style>
    <link rel="stylesheet" href="/node_modules/bootstrap/dist/css/bootstrap.css">
    <link rel="stylesheet" href="/node_modules/formiojs/dist/formio.full.min.css">
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
            renderMode: 'form'
       }).then(function(form) {
           form.submission =  <%- JSON.stringify(submission) %>
        });
      };

    </script>
  <body>
    <div id='formio' class="container"></div>
  </body>
</html>`;

export default template;
