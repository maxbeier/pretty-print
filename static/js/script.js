document.addEventListener('DOMContentLoaded', () => {

   const $outputBlock = document.querySelector('.output-block');
   const $outputPdf = document.querySelector('.output-pdf');
   const $generateButton = document.querySelector('[data-action="generate-pdf"]');
   const $downloadButton = document.querySelector('[data-action="download-pdf"]');
   const $markdownEditor = document.querySelector('[name="markdown"]');

   $generateButton.onclick = generatePdf;

   function generatePdf() {
      const url = '/generate';
      const requestData = {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
         },
         body: `content=${encodeURIComponent($markdownEditor.value)}`,
      };
      const dataURI = 'data:text/html;charset=utf-8,';

      $generateButton.disabled = true;
      $outputBlock.classList.remove('hidden');
      showResult('static/loader.html');

      fetch(url, requestData)
         .then(checkStatus)
         .then(response => showResult(response.headers.get('location'), true))
         .catch(error => showResult(dataURI + escape(error)));

      function checkStatus(response) {
         if (response.status === 201) {
            return response;
         }
         return response.text().then(error => Promise.reject(error));
      }

      function showResult(src, showButton) {
         $outputPdf.src = src;
         $generateButton.disabled = false;

         if (showButton) {
            $downloadButton.href = src;
            $downloadButton.style.display = 'block';
         }
         else {
            $downloadButton.style.display = 'none';
         }
      }
   }


   // Same with XMLHttpRequest

   // function generatePdf() {
   //    const httpRequest = new XMLHttpRequest();
   //    const content = $markdownEditor.value;

   //    httpRequest.onreadystatechange = handleResponse;
   //    httpRequest.open('POST', '/generate');
   //    httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
   //    httpRequest.send(`content=${encodeURIComponent(content)}`);

   //    function handleResponse() {
   //       if (httpRequest.readyState !== XMLHttpRequest.DONE) return;

   //       if (httpRequest.status === 201) {
   //          $outputPdf.src = httpRequest.getResponseHeader('location');
   //          $downloadButton.style.display = 'block';
   //       }
   //       else {
   //          $outputPdf.src = `data:text/html;charset=utf-8,${escape(httpRequest.responseText)}`;
   //          $downloadButton.style.display = 'none';
   //       }
   //       $outputBlock.classList.remove('hidden');
   //    }
   // }

});
