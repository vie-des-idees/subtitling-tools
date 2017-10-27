#! /bin/env node
/* eslint-env es6 */
/* eslint no-console:0, quotes:0 */
"use strict";

const  fs = require('fs');
const  util = require('util');
const cheerio = require('cheerio');

function ms2time(ms) {
  const d = new Date(ms);
  // return d.toISOString().replace(/.*T(.*)Z/,'$1')
  // '00:00:04.719'
  return d.toISOString().replace(/.*T(.*)\.(.*)Z/, '$1,$2');
  // '00:00:04,719'
}

function html2srt(html_file) {
  const srt_file = html_file.replace(/(\.html)?$/,'.srt');

  const html = fs.readFileSync(html_file);
  const $ = cheerio.load(html);
  const nodes = $('#event-lines-container>div');
  const data = {
    count: nodes.length,
    events: nodes.map((num, evt) => {
      return {
        num: num,
        startMs: $('input', evt).first().data('startMs'),
        endMs: $('input', evt).last().data('endMs'),
        text: $('textarea', evt).text()
      };
    }).get()
  };

  fs.open(srt_file, 'wx', (err, srt) => {
    if (err) {
      if (err.code === "EEXIST") {
        console.error(`Output subtitles file already exists: ${srt_file}`);
        return;
      } else {
        throw err;
      }
    }
    // srt.on('error', err => { throw err; });
    data.events.forEach(rcd => {
      // console.dir(rcd);
      fs.writeSync(srt,
                   util.format("%d\n%s --> %s\n%s\n\n",
                               rcd.num,
                               ms2time(rcd.startMs),
                               ms2time(rcd.endMs),
                               rcd.text));
    });
  });
}

process.argv.forEach((val, index) => {
  // console.log(`Processing ${index}: ${val}`);
  // Processing 0: /home/mich/.nvm/versions/node/v8.7.0/bin/node
  // Processing 1: /home/mich/Devlp/viedi/subtitling-tools/editor-to-srt.js

  if (index>1) {
    if (val.match('\.html?$')) {
      html2srt(val);
    } else {
      console.error("Cowardly omitting unexpected input filename: %s", val);
    }
  }
});
