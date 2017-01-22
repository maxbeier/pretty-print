#!/usr/bin/env python

from config import config
from flask import Flask, request, render_template, make_response, redirect, json
from cache import cached
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

import os.path
import re
import hashlib
import pypandoc  # https://github.com/bebraw/pypandoc


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
            convert(content, filename)
        except RuntimeError as e:
            response = '<code>{}</code>'.format(str(e).replace('\\n', '<br>'))
            return make_response(response, 500)

    return redirect(filename, code=201)


def convert(content, filename):
    pypandoc.convert(
        content,
        'pdf',
        format='markdown',
        outputfile=filename,
        extra_args=[
            '--latex-engine=xelatex',
            '--variable', 'fontsize=10pt',
            '--variable', 'geometry:a4paper, landscape, twocolumn,\
                columnsep=2cm, top=2cm, bottom=2cm, left=2cm, right=2cm'
        ]
    )


@cached()
def call_api(article_url):
    url = '{}?url={}'.format(config['API_URL'], article_url)
    req = Request(url)
    req.add_header('x-api-key', config['API_KEY'])
    req.add_header('Content-Type', 'application/json')

    try:
        # load via Mercury API
        print(url)
        response = urlopen(req)
        print(response)
    except HTTPError:
        try:
            # load directly
            return urlopen(article_url).read()
        except (HTTPError, URLError) as e:
            return 'Datei konnte nicht geladen werden: {}'.format(str(e))

    data = json.loads(response.read())

    markdown = pypandoc.convert(data['content'], 'md', format='html')
    data['markdown'] = clean_content(markdown)

    if data['date_published']:
        data['date'] = datetime.strptime(data['date_published'], '%Y-%m-%dT%H:%M:%S.%fZ')

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
