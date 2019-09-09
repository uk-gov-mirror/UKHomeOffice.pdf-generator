const template = `<html>
<head>
<style type="text/css" media="print">
      div.page
      {
        page-break-after: always;
        page-break-inside: avoid;
      }
</style>
 <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
        integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
 <link rel="stylesheet" href="https://unpkg.com/formiojs@4.0.0-rc.27/dist/formio.full.min.css"
        integrity="sha384-qCmHtp5QGqc3DEUNAdcjETwaX3+JYREeRcBOEKW98JTIDWe3VZD9xBlaYc1/gmWZ" crossorigin="anonymous">
    <script src="https://unpkg.com/formiojs@4.0.0-rc.27/dist/formio.full.js"
        integrity="sha384-7Ohrz9GNTMS/34ninSvE7iUeX7D3hU8/NMXRc2APYW9JbpNneHepOXUUR2rNpsGC" crossorigin="anonymous">

</script>
    <script type='text/javascript'>
      window.onload = function() {
       Formio.createForm(document.getElementById('formio'),  <%- JSON.stringify(formSchema) %>).then(function(form) {
           form.submission =  <%- JSON.stringify(submission) %>
        });
      };
    </script>
  </head>
  <body>
    <div id='formio'></div>
  </body>
</html>`;

export default template;
