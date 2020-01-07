const hljs = require('highlight.js')
const cheerio = require('cheerio')
const Token = require('markdown-it/lib/token')

const renderHighlight = function(str, lang) {
  console.log('6')

  if (!(lang && hljs.getLanguage(lang))) {

    console.log(arguments)
    return ''
  }

  try {
    return replaceDelimiters(hljs.highlight(lang, str, true).value)
  } catch (err) {
  }
}

const replaceDelimiters = function(str) {
  return str.replace(/({{|}})/g, '<span>$1</span>')
}

const fetch = (str, tag, scoped) => {
  const $ = cheerio.load(str, {
    decodeEntities: false,
    xmlMode: true,
  });
  if (!tag) {
    return str;
  }
  if (tag === 'style') {
    return scoped
      ? $(`${tag}[scoped]`).html()
      : $(`${tag}`)
          .not(`${tag}[scoped]`)
          .html();
  }
  return $(tag).html();
};


const md = require('markdown-it')('default', {
  html: true,
  breaks: true,
  highlight: renderHighlight,
}).use(require('markdown-it-anchor'), {
  level: 2,
  slugify: string =>
    string
      .trim()
      .split(' ')
      .join('-'),
  permalink: true,
  permalinkClass: 'anchor',
  permalinkSymbol: '#',
  permalinkBefore: false,
});

const cnReg = new RegExp('<(cn)(?:[^<]|<)+</\\1>', 'g');
const usReg = new RegExp('<(us)(?:[^<]|<)+</\\1>', 'g');

md.core.ruler.push('update_template', function replace({ tokens }) {
  let cn = '';
  let us = '';
  let template = '';
  let script = '';
  let style = '';
  let scopedStyle = '';
  let code = '';
  let sourceCode = '';
  tokens.forEach(token => {
    if (token.type === 'html_block') {
      if (token.content.match(cnReg)) {
        cn = fetch(token.content, 'cn');
        token.content = '';
      }
      if (token.content.match(usReg)) {
        us = fetch(token.content, 'us');
        token.content = '';
      }
    }
    if (token.type === 'fence' && token.info === 'tpl' && token.markup === '```') {
      sourceCode = token.content;
      code = '````html\n' + token.content + '````';
      template = fetch(token.content, 'template');
      script = fetch(token.content, 'script');
      style = fetch(token.content, 'style');
      scopedStyle = fetch(token.content, 'style', true);
      token.content = '';
      token.type = 'html_block';
    }
  });
  if (template) {
    let jsfiddle = {
      html: template,
      script,
      style,
      us,
      cn,
      sourceCode,
    };
    jsfiddle = md.utils.escapeHtml(JSON.stringify(jsfiddle));
    const codeHtml = code ? md.render(code) : '';
    const cnHtml = cn ? md.render(cn) : '';
    let newContent = `
      <template>
        <div :jsfiddle="${jsfiddle}">
          <template slot="component">${template}</template>
          <template slot="description">${cnHtml}</template>
          <template slot="us-description">${us ? md.render(us) : ''}</template>
          <template slot="code">${codeHtml}</template>
        </div>
      </template>`;
    newContent += script
      ? `
      <script>
      ${script || ''}
      </script>
      `
      : '';
    newContent += style ? `<style>${style || ''}</style>` : '';
    newContent += scopedStyle ? `<style scoped>${scopedStyle || ''}</style>` : '';
    const t = new Token('html_block', '', 0);
    t.content = newContent;
    tokens.push(t);
  }
});

module.exports = md
