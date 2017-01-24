FROM node:boron

LABEL name "pretty-print"

# Install pandoc and pdflatex
RUN apt-get update -y \
   && apt-get install -y --no-install-recommends \
      texlive-latex-base \
      texlive-xetex \
      texlive-math-extra \
      texlive-latex-extra \
      texlive-fonts-extra \
      texlive-bibtex-extra \
      latex-xcolor \
      fontconfig \
      lmodern \
      pandoc

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 80
CMD [ "npm", "start" ]
