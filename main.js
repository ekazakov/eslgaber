'use strict';
import req from 'request-promise';
import cheerio from 'cheerio';
import Promise from 'bluebird';
import _ from 'lodash';
import fs from 'fs';
import encoding from 'encoding';

const url = 'https://www.eslpod.com/website/show_all.php';
const param = 'low_rec';
const getUrl = (offset = 0) => `https://www.eslpod.com/website/show_all.php?low_rec=${offset}`;

const PAGE_COUNT = 72;
const PAGE_OFFSET = 20;

const parseResponse = function (response) {
    const buffer = encoding.convert(response.body, 'utf8', 'CP-1252');
    const $ = cheerio.load(buffer.toString());
    const links = [];

    $('a.podcast_title').each((index, link) => links.push($(link)));

    return _(links)
        .filter((link) => $(link).text().startsWith('ESL Podcast'))
        .map(getRecord)
        .value()
    ;
}

const getRecord = function (link) {
    const match = link.text().match(/\s(\d{1,})\s/)
    if (match == null) {
        //console.log('wrong link', link.text());
        return '';
    }
    const podNumber = match[1];
    return JSON.stringify({
        number: Number(podNumber),
        name: link.text().split('ý').join('—').trim(),
        pageUrl: `https://www.eslpod.com/website/${link.attr('href')}`,
        mp3Url: `http://libsyn.com/media/eslpod/ESLPod${podNumber}.mp3`
    });
}

const file = fs.createWriteStream('pages.txt');

console.log('Start');

const prepareRequest = (offset) =>
    () => new Promise(function (resolve) {
        req.get({uri: getUrl(offset), resolveWithFullResponse: true})
            .then((response) => resolve({success: true, response}))
            .then((error) => resolve({success: false, error, offset}))
    }).then((result) => {
        console.log('page:', (offset/PAGE_OFFSET + 1), 'of', PAGE_COUNT);
        if (result.success) {
            parseResponse(result.response).forEach((record) => file.write(record + '\n'));
        } else {
            console.log(result.error);
        }
    })
;

const requests = _(PAGE_COUNT)
    .times((pageNumber) => prepareRequest(pageNumber * PAGE_OFFSET))
    .value()
;

Promise
    .map(requests, (request) => request(), {concurrency: 5})
    .then((responses) => {
        console.log(responses.length);
        console.log('Done');
    })
    .finally(() => file.end())
;
//Promise.settle(requests)

//req
//    .get({uri: gerUrl(), resolveWithFullResponse: true})
//    .then(parseResponse)
//    .catch((error) => console.log(error))
//;
