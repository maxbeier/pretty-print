# Pretty Print

Convert web pages into pretty pdf documents.

![Screenshot](https://raw.githubusercontent.com/maxbeier/pretty-print/master/screenshot.png)


## Usage

You'll need an API key for [Mercury](https://mercury.postlight.com/web-parser/).

```sh
echo "MERCURY_KEY=$YOUR_KEY" > .env
npm install

# run dev
npm run dev

# run prod
npm start

# deploy on now.sh
npm run deploy
```


## Alternative Parsers

- [ageitgey/node-unfluff](https://github.com/ageitgey/node-unfluff)
- [codelucas/newspaper](https://github.com/codelucas/newspaper)
- [luin/readability](https://github.com/luin/readability)
- [mozilla/readability](https://github.com/mozilla/readability)
