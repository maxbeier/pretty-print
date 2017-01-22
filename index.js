const bodyParser = require('body-parser');
const compress = require('compression');
const execFile = require('child_process').execFile;
const express = require('express');
const fs = require('fs');
const MercuryClient = require('mercury-client');
const pandocBinary = require('pandoc-bin').path;
const path = require('path');
const sha256 = require('sha256');
const stream = require('stream');
const striptags = require('striptags');
require('dotenv').config();

const app = express();

app.use(compress());
app.use(bodyParser.text());
app.use(express.static(path.resolve('static')));

app.set('views', path.resolve('templates'));
app.set('view engine', 'pug');

app.listen(3000);

app.get('/', (req, res) => {
   loadArticle(req.query.url)
      .then(article => res.render('index', article))
      .catch(err => res.render('index', { error: err }));
});

app.post('/', (req, res) => {
   const content = req.body;
   const hash = sha256(content);
   const file = `articles/${hash}.pdf`;
   const success = () => res.location(file).status(201).send();

   fs.exists(file, (exists) => {
      if (exists) return success();
      return generatePDF(content, hash)
         .then(success)
         .catch(err => res.status(500).send(err));
   });
});

function loadArticle(url) {
   if (!url) return Promise.resolve(null);
   return new MercuryClient(process.env.MERCURY_KEY).parse(url)
      .then(article => pandoc(['--from=html', '--to=markdown', '--no-wrap'], article.content)
      .then((markdown) => {
         article.markdown = striptags(markdown).trim();
         return article;
      }));
}

function generatePDF(content, filename) {
   const folder = path.resolve('static/articles');
   const remove = () => fs.unlinkSync(`${folder}/${filename}.pdf`);
   const params = [
      `--output=${filename}.pdf`,
      '--from=markdown',
      '--latex-engine=xelatex',
      '--variable', 'fontsize=10pt',
      '--variable', 'geometry:a4paper, landscape, twocolumn, columnsep=2cm, top=2cm, bottom=2cm, left=2cm, right=2cm',
   ];
   return pandoc(params, content, folder)
      .then(() => setTimeout(remove, 15 * 60 * 1000)); // remove after 15 min);
}

function pandoc(params, input, cwd) {
   return new Promise((resolve, reject) => {
      const child = execFile(pandocBinary, params, { cwd }, (err, stdout, stderr) => {
         if (err || stderr) return reject(err || stderr);
         return resolve(stdout);
      });

      const stdinStream = new stream.Readable();
      stdinStream.push(input);
      stdinStream.push(null); // eof
      stdinStream.pipe(child.stdin);
   });
}
