#!/usr/bin/env python

from config import config
from flask import Flask
from flask import request
from flask import render_template
from flask import make_response
from flask import redirect
from flask import json
from cache import cached
from datetime import datetime
import os.path
import re
import hashlib
import pypandoc  # https://github.com/bebraw/pypandoc
import urllib.request


app = Flask(__name__)


@app.route('/')
def index():
    url = request.args.get('url')
    article = None
    if url:
        article = call_api(url)
    return render_template('index.html', article=article, url=url)


@app.route('/generate', methods=['POST'])
def generate_pdf():
    content = request.form.get('content').encode('utf-8')
    content_hash = hashlib.sha256(content).hexdigest()
    filename = 'static/articles/{}.pdf'.format(content_hash)

    if not os.path.exists(filename):
        try:
            pypandoc.convert(
                content,
                'pdf',
                format='markdown',
                outputfile=filename,
                extra_args=[
                    '--latex-engine=xelatex',
                    '-V', 'geometry:a4paper, landscape, twocolumn, columnsep=2cm,\
                        top=2cm, bottom=2cm, left=2cm, right=2cm'
                ]
            )
        except RuntimeError as e:
            response = '<code>{}</code>'.format(str(e).replace('\\n', '<br>'))
            return make_response(response, 500)

    return redirect(filename, code=201)


@cached()
def call_api(article_url):
    url = '{}/article?api_key={}&url={}'.format(
        config['API_URL'], config['API_KEY'], article_url)

    try:
        response = urllib.request.urlopen(url)
    except urllib.error.HTTPError as e:
        return 'Datei konnte nicht geladen werden: {}'.format(str(e))

    data = json.loads(response.read())

    markdown = pypandoc.convert(data['html'], 'md', format='html')
    data['markdown'] = clean_content(markdown)

    if data['date']:
        data['date'] = datetime.fromtimestamp(int(data['date']))

    return render_template('preview.md', **data)


def clean_content(content):
    # strip white space and slashes
    content = content.strip().strip('\\')

    # remove html tags
    content = re.sub(r'<[^>]+>', '', content)

    # In some articles every line ends with a slash -- remove them
    content = content.replace('\\\n', '\n')

    # reduce empty lines
    while '\n\n\n' in content:
        content = content.replace('\n\n\n', '\n\n')

    # strip white space and slashes again
    content = content.strip('\\').strip()

    return content


if __name__ == '__main__':
    app.debug = True
    app.run()
