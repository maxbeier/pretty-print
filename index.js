const bodyParser = require('body-parser');
const compress = require('compression');
const execFile = require('child_process').execFile;
const express = require('express');
const fs = require('fs');
const MercuryClient = require('mercury-client');
const path = require('path');
const sha256 = require('sha256');
const striptags = require('striptags');
const request = require('request');
require('dotenv').config();

const app = express();

app.enable('trust proxy');
app.use(compress());
app.use(bodyParser.text());
app.use(express.static(path.resolve('static')));

app.set('views', path.resolve('templates'));
app.set('view engine', 'pug');

app.listen(process.env.PORT || 3000);

app.get('/', (req, res) => {
   loadArticle(req.query.url, req)
      .then(article => res.render('index', article))
      .catch(error => res.render('index', { error }));
});

app.post('/', (req, res) => {
   const content = req.body;
   const hash = sha256(content);
   const file = `articles/${hash}.pdf`;
   const success = () => res.location(file).status(201).send();

   fs.exists(`static/${file}`, (exists) => {
      if (exists) return success();
      return generatePDF(content, hash)
         .then(success)
         .catch(error => res.status(500).send(error));
   });
});

app.get('/proxy', (req, res) => {
   const options = {
      url: req.query.url,
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
   };
   request(options, (error, response, body) => {
      if (error) res.status(500).send(error);
      else res.send(body);
   });
});

async function loadArticle(url, req) {
   if (!url) return null;

   // const proxiedUrl = `${req.protocol}://${req.get('host')}/proxy?url=${url}`;
   const article = await new MercuryClient(process.env.MERCURY_KEY).parse(url);

   if (!article) throw new Error('Could not fetch article. This seems to happen erratically.');

   const markdown = await pandoc(['--from=html', '--to=markdown', '--wrap=none'], article.content);
   article.markdown = clean(markdown);
   return article;
}

function generatePDF(content, filename) {
   const folder = path.resolve('static/articles');
   const remove = () => fs.unlink(`${folder}/${filename}.pdf`, console.log);
   const params = [
      `--output=${filename}.pdf`,
      `--template=${path.resolve('templates/article.tex')}`,
      '--from=markdown',
      '--latex-engine=xelatex',
      '--variable', 'fontsize=10pt',
      '--variable', 'geometry:a4paper, landscape, twocolumn, columnsep=2cm, top=2cm, bottom=2cm, left=2cm, right=2cm',
   ];
   return pandoc(params, content, folder)
      .then(() => setTimeout(remove, 15 * 60 * 1000)); // remove after 15 minutes;
}

function pandoc(params, input, cwd) {
   return new Promise((resolve, reject) => {
      const child = execFile('pandoc', params, { cwd }, (err, stdout, stderr) => {
         if (err || stderr) return reject(err || stderr);
         return resolve(stdout);
      });
      child.stdin.end(input);
   });
}

function clean(content) {
   return striptags(content) // remove html tags
      .replace(/\\\n/g, '\n') // remove trailing slashes
      .replace(/(\n\s*?\n)\s*\n/g, '$1') // reduce multiple line breaks but preserve whitespace
      .trim(); // remove surrounding whitespace
}
