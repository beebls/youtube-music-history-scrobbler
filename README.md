# Youtube Music History Scrobbler

After recently starting to use Last.fm, I wondered if there was a way to import my previous listening.
I found solutions for Spotify and other services, but none for YTM.

So I made one myself.

## How To Use:

You first need to go to [Google Takeout](https://takeout.google.com/) and download your youtube data in JSON format.
First uncheck all of the categories except "_YouTube and YouTube Music_"
Click on the "_Multile formats_" button, and switch the History option from HTML to JSON,
Request the data and wait for a download.
This should give you a folder with lots of data, but the file we are looking for is "**watch-history.json**"

While you are waiting, download or clone this github repo and unzip it.
All of the dependencies and other files come with it, so there is no installation.

Take the **watch-history.json** file and drag it into the youtube-music-history-scrobbler directory,
then, simply run **Start.bat** (or run node index.js in a terminal).

_Due to all of the API requests, it is not the most stable and may end prematurely,_
_if this happens, just restart it and it should work_

## What To Do Once You Get The File

The rest is automatic and it should produce one or more _formatted.json_ files which you can upload to a bulk scrobbler.
I reccommend [Last.fm-Scrubbler-WPF](https://github.com/SHOEGAZEssb/Last.fm-Scrubbler-WPF) and it's File Parse Scrobble,
but others should work.

## Issues ()

#### Issues with YouTube Music

YouTube Music has no way to export your history. The only way you can is by going to takeout.google.com and exporting your
comined Youtube AND YouTube Music data.
Luckily, all YouTube Music entries are flagged with a header, so the file is easy to parse.

Given that YouTube Music is just a fancy UI for watching YouTube Videos, not all of the entries are actual songs,
this means I couldn't include all YTM results, as random one-off remixes and other songs uploaded by single people
would be included.
I found that every song officially published was published under the "Artist Name - Topic" format (Ex: Kanye West - Topic)
the inputted file is filtered to only include songs from these topic artists, meaning they all are "official" songs.

This data, however, is very basic. Containing only song name, artist, and time.
Last.fm wants more data, most importantly, album information.
The only way to get around this is by querying the YouTube API for each song, and then taking the album variable from it.
This works, however given that 1000s of queries need to be executed quickly, not all of them are successful,
leading to a ~90% success rate in getting album names.

#### Issues with Last.fm

Last.fm only allows for 3000 scrobbles per day before it limits your account,
this program will generate multiple files if the input is over 3000 songs, but you have to remember to only upload one per day.

#### Issues with the program

The YouTube Music API errored consistently after ~1900 requests being sent, so to counter this, the program sends requests in batches of 1000

Each batch calls the API and provides the same callback function.
The API requests return out of order and at different times, so there is no orderly way of managing the return data.
Additionally, not all requests end up returning any data, some return undefined or error.

This means that while I can easily associate album data with the song it belongs to,
knowing when all of the requests have returned is more complicated.
To fix this in the short term I added a small "padding" of 5 requests lost per batch, and while it works, it is nowhere near as
orderly or redundant as I wish it could be.
