"use strict";

const fs = require("fs");
const YoutubeMusicApi = require("youtube-music-api");
const api = new YoutubeMusicApi();

const rawData = fs.readFileSync("watch-history.json");
const parsedData = JSON.parse(rawData);
// This is the array that will eventually be written to the JSON
let finishedArr = [];

console.log("Filtering initial file for only YouTube Music results");
//Parsing the JSON for all the data it has
const initData = function () {
  for (let i of parsedData) {
    if (i.header === "YouTube Music") {
      let newObj = {};
      const rawArtist = JSON.stringify(i.subtitles)
        ?.split(",")[0]
        .slice(10, -1);
      if (rawArtist !== undefined) {
        if (rawArtist.includes(" - Topic")) {
          const artist = rawArtist.slice(0, -8);
          const title = i.title.slice(8);
          const songId = i.titleUrl.slice(32);
          // Long thing but it just takes the little sections of the text for month, day, and year and reorders them
          // const time = `${i.time.slice(5, 7)}/${i.time.slice(
          //   8,
          //   10
          // )}/${i.time.slice(0, 4)} ${i.time.slice(11, 16)}`;
          const time = i.time;
          newObj.artistName = artist;
          newObj.trackName = title;
          newObj.ts = time;
          newObj.id = songId;
          finishedArr.push(newObj);
        }
      }
    }
  }
};
initData();

console.log(
  "\x1b[1m",
  `Found ${finishedArr.length} Youtube Music songs in watch-history.json`
);
console.log(
  "\x1b[31m%s\x1b[4m",
  `watch-history.json does not have album names, grabbing them from Youtube API (only 90% success rate)`
);
console.log(
  "\x1b[35m%s",
  "If the program stops before it says file written, an error occured, just close and re-run"
);

// Count variables to ensure batching and finishing happens
let lastIndex = 0;
let curIndex = 0;
let callbackCount = 0;
let successfullAPIs = 0;

// Turns to true after first finish call, preventing duplicates
let finishCalled = false;

// The api errored every time around ~1900, so I'm batching it in sets of 1000 to prevent that
const batchAPI = function (index) {
  // Have to store index outside to prevent double-calling this in the callback loop
  curIndex = index;
  console.log("\x1b[0m", `Api Querying items ${lastIndex} to ${curIndex}`);
  api.initalize().then((info) => {
    finishedArr.map((d, i) => {
      if (i >= lastIndex && i <= index) {
        const id = d.id;
        if (id) {
          api.search(id).then((result) => {
            callback(result, i);
          });
        }
      }
    });
  });
};
batchAPI(1000);

// I could've done this in the callback, but it made sense to refactor it out
function callback(result, i) {
  callbackCount++;
  if (result.content[0]?.album) {
    finishedArr[i].albumName = result.content[0].album.name;
    successfullAPIs++;
    // console.log(curIndex, successfullAPIs, i, callbackCount);
    if (callbackCount > curIndex - 3) {
      console.log(`Successfully Grabbed ${successfullAPIs} Album Names So Far`);
      lastIndex = curIndex;
      batchAPI(curIndex + 1000);
    }
    if (callbackCount + 10 > finishedArr.length) {
      !finishCalled && finish();
    }
  }
}

let numFiles = 0;

//This is called once (nearly) every api request is in
function finish() {
  finishCalled = true;
  console.log(
    "\x1b[33m%s\x1b[0m",
    `Finished with ${successfullAPIs} successfull API requests.`
  );
  console.log(
    "\x1b[33m%s\x1b[0m",
    "Waiting 5 seconds for last requests to pour in before writing to file"
  );
  setTimeout(() => {
    for (let i of finishedArr) {
      delete i.id;
    }
    if (finishedArr.length < 2800) {
      fs.writeFile(
        "formatted.json",
        JSON.stringify(finishedArr, null, 2),
        (err) => {
          if (err) throw err;
        }
      );
    } else {
      while (finishedArr.length > 0) {
        const arrSection = finishedArr.splice(0, 2800);
        numFiles++;
        fs.writeFile(
          `formatted-${numFiles}.json`,
          JSON.stringify(arrSection, null, 2),
          (err) => {
            if (err) throw err;
          }
        );
      }
    }
    console.log(
      "\x1b[36m%s\x1b[0m",
      "Finished Successfully, final file(s) called formatted.json"
    );
    console.log("\x1b[32m%s\x1b[0m", "Download and open Last.FM-Scrubbler-WPF");
    console.log(
      "\x1b[32m%s\x1b[0m",
      "https://github.com/SHOEGAZEssb/Last.fm-Scrubbler-WPF"
    );
    console.log(
      "\x1b[32m%s\x1b[0m",
      "Select 'File Parse Scrobbler', change the Parser to JSON, import formatted.json and click Parse"
    );
    console.log("\x1b[32m%s\x1b[0m", ":)");
  }, 5000);
}
