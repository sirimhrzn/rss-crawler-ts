import { Elysia } from "elysia";
import { RSSDetail, News, SourceDetails, NewsItem, State, Category, categoryArray } from "./types/types";
import { XMLParser } from 'fast-xml-parser';
import { format } from 'date-fns';
import * as cheerio from 'cheerio';
import { time } from "console";
import { getImage } from "./getImage"
import et from "date-fns/locale/et";
import { exit } from "process";
const md5 = require('md5');
const { v4: uuidv4 } = require('uuid');

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);


const sourceList: SourceDetails = await Bun.file("src/sources.json").json()
const souceList: SourceDetails = {
  "FRDH": {
    "feed_urls": {
      "oths": "http://arthadabali.com/feed",
    },
    "tier_config": {
      "interval_value": "900",
      "slug": "MID"
    }
  }
};

//const source = "FRDH";
const timeFormat = "yyyy-MM-dd H:m:s";
//const feed_urls = sourceList[source].feed_urls;
const currentTime = format(new Date(), timeFormat);
const STATEJSON = "state.json";

let stateJSON = Bun.file(STATEJSON);

//var feedBuildCount: number = 0;

for (const source in sourceList) {
  for (const categories in sourceList[source].feed_urls) {
    let file = await stateJSON.exists();
    let dataExists = false;
    var state: State = {};
    if (file) {
      await Bun.file(STATEJSON).json().then((data) => {
        state = data;
        dataExists = true;
      }).catch((err) => {
        console.log(`[${currentTime}] ${STATEJSON} file doesnot exists. ${err}`)
      });
    }
    if (!categoryArray.includes(categories)) {
      console.log(`[${currentTime}] ${categories} category doesnot exist `)
      continue;
    }
    const category: Category = categories as Category;
    const url = sourceList[source].feed_urls[category] ?? '';
    if (url == '') {
      console.log(`[${currentTime}] ${source}-${category} URL EMPTY`)
      continue;
    }
    const md5Url = md5(url);
    console.log(`[${currentTime}] RSS processing ${url}`);
    let fetchFail = false;
    let etag: string = '';
    await fetch(url)
      .then(async (rssData) => {
        let data = await rssData.text();
        let previousEtag: string | undefined;
        if (dataExists && state[source]) {
          previousEtag = state[source][category];
        }
        etag = rssData.headers.get("etag")?.replace(/"/g, '') ?? '';
        if ((etag !== '' && previousEtag) && previousEtag == etag) {
          console.log(`[${currentTime}] Etag for ${source}-${category} not changed`)
          fetchFail = true;
          return
        }
        const options = {
          ignoreAttributes: false,
          attributeNamePrefix: ""
        };
        let parser = new XMLParser(options);
        let feed: RSSDetail = parser.parse(data);
        feed.rss.channel.item.forEach(async (news) => {
          if (news.title == undefined) {
            fetchFail = true
            console.log(`[${currentTime}] Skipping ${news.link}: TITLE EMPTY`)
            return
          }
        })
      }).catch((err) => {
        console.log(`[${currentTime}] Error processing ${url} ${err}`)
        fetchFail = true;
      });
    if (fetchFail) {
      console.log(`[${currentTime}] Skipping RSS ${url}`);
      fetchFail = false
      continue;
    }
    if (etag !== '' || dataExists) {
      if (!state[source] && etag == '') {
        console.log(`[${currentTime}] no etag for ${source}-${category}`)
        continue
      }
      if (!state[source]) {
        state[source] = {
          [category]: etag
        };
      } else {
        state[source][category] = etag
      }
      await Bun.write(STATEJSON, JSON.stringify(state));
      console.log(`[${currentTime}] Adding ${source} with etag to ${STATEJSON}`)
    }

  }
}
console.log(state)
async function FeedBuilder(category: string, news: NewsItem): Promise<News> {
  let strippedContent = news["content:encoded"] ? cheerio.load(news["content:encoded"]).text() ?? "" : "";
  let strippedDescription = news.description ? cheerio.load(news.description).text() ?? "" : "";
  let imageurl = await getImage(news.link);
  return {
    title: news.title,
    description: strippedDescription,
    content: strippedContent,
    image: imageurl,
    link: news.link,
    source: source,
    category: category,
    uuid: uuidv4(),
    guid: news.guid["#text"] ?? news.guid ?? "",
    author: news["dc:creator"] ?? "",
    fetch_date: currentTime,
    pub_date: format(new Date(news.pubDate), timeFormat) ?? currentTime,
    update_date: currentTime,
  }
}
const wordChecker = (title: string, word: string): boolean => {
  return title.includes(word)
}
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
