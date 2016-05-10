from flask import Flask
from flask import request
from flask import render_template
from flask import redirect
from flask import json
from datetime import datetime
import re
import hashlib
import pypandoc  # https://github.com/bebraw/pypandoc
import urllib.request

API_URL = 'https://www.instaparser.com/api/1/article'
API_KEY = '2ee3b12c669743c19064369fa32c70c8'
TAG_RE = re.compile(r'<[^>]+>')


app = Flask(__name__)


@app.route('/')
def index():
    url = request.args.get('url')
    if url:
        return render_template('article.html', article=call_api(url))
    return render_template('index.html')


@app.route('/generate', methods=['POST'])
def generate_pdf():
    content = request.form.get('content').encode('utf-8')
    content_hash = hashlib.sha256(content).hexdigest()
    filename = 'static/articles/{}.pdf'.format(content_hash)

    # TODO: Check if file exists

    try:
        pypandoc.convert(
            content,
            'pdf',
            format='markdown',
            outputfile=filename,
            extra_args=[
                '--latex-engine=xelatex',
                '-V', 'geometry:landscape, twocolumn, columnsep=1cm,\
                    top=1cm, bottom=2cm, left=1cm, right=1cm'
            ]
        )
    except RuntimeError as e:
        return '<pre>' + str(e).replace('\\n', '<br>') + '</pre>'

    return redirect(filename, code=303)


def call_api(article_url):
    url = '{}?api_key={}&url={}'.format(API_URL, API_KEY, article_url)
    json_data = urllib.request.urlopen(url).read()
    data = json.loads(json_data)

    if data['date']:
        date = data['date']
        date = datetime.fromtimestamp(int(date))
        data['date'] = ', ' + date.strftime('%d.%m.%Y')
    else:
        data['date'] = ''

    data['url'] = data['url'].lower()

    markdown = pypandoc.convert(data['html'], 'md', format='html')
    result = '# {title}\n\n_{author}{date} on {url}_\n\n'.format(**data)
    result += clean_content(markdown)
    return result


def clean_content(content):
    # strip white space
    content = content.strip()

    # remove html tags
    content = TAG_RE.sub('', content)

    # In some articles every line ends with a slash -- remove them
    content = content.replace('\\\n', '\n')

    # reduce empty lines
    while '\n\n\n' in content:
        content = content.replace('\n\n\n', '\n\n')

    return content


if __name__ == '__main__':
    app.debug = True
    app.run()
