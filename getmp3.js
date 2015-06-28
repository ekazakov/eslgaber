import wgetjs from 'wgetjs';
import fs from 'fs';
import req from 'request-promise';
import Promise from 'bluebird';
import _ from 'lodash';
import progress from 'request-progress';

let downloadCounter = 0;
const downloadings = new Map();
const out = process.stdout;


let isFirstRender = true;

const renderProgress = (items) => {
    console.log(`>> File ${downloadCounter} of ${requests.length} downloaded\n`);
    for (let [name, progress] of items) {
        console.log(`${name} ready on ${progress}%`)
    }
};

const clearOut = (items) => {
    out.moveCursor(0, -1 * items.size - 2);
    out.clearScreenDown();
    out.cursorTo(0);
}

const prepareRequest = (record) =>
        () => new Promise(function (resolve) {
            progress(req.get({uri: record.mp3Url}))
                .on('progress', (state) => {
                    if (!isFirstRender) clearOut(downloadings);
                    isFirstRender = false;
                    downloadings.set(record.name, state.percent);
                    renderProgress(downloadings);
                })
                .pipe(fs.createWriteStream(`mp3/${record.name}.mp3`))
                .on('error', (error) => resolve({success: false, error}))
                .on('finish', () => resolve({success: true}))
            ;
        }).then((result) => {
            if (result.success) {
                downloadCounter++;
                clearOut(downloadings);
                downloadings.delete(record.name);
                renderProgress(downloadings);
                //console.log(`>> File ${downloadCounter} of ${requests.length} downloaded`);
            } else {
                console.log(`>> Error for ${record.name}`);
                console.log(result.error);
            }
        })
    ;


const pods = fs.readFileSync('pages.txt', {encoding: 'utf8'});

const requests = _(pods.split('\n'))
    .compact()
    .map(JSON.parse)
    .sortBy('number')
    .map(prepareRequest)
    .value()
;


Promise
    .map(requests, (request) => request(), {concurrency: 10})
    .then((responses) => console.log(responses.length))
    .finally(() => console.log('Done'))
;
