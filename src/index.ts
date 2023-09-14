import { Elysia } from "elysia";
import { RSSDetail, News, SourceDetails, NewsItem } from "./types/types";
import { XMLParser } from 'fast-xml-parser';
import { format } from 'date-fns';
import * as cheerio from 'cheerio';
import { time } from "console";
import { getImage } from "./getImage"
const md5 = require('md5');
const { v4: uuidv4 } = require('uuid');

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);


const sourceList: SourceDetails = {
  "FRDH": {
    "feed_urls": {
      "entm": "https://farakdhar.com/hamro-rss/?cat=arts",
      "tops": "https://arthasarokar.com/feeds/posts/default/-/NEPALI%20PATRO?alt=rss",
      "oths": "https://www.bizkhabar.com/category/bichar/feed",
    },
    "tier_config": {
      "interval_value": "900",
      "slug": "MID"
    }
  }
};

const source = "FRDH";
const timeFormat = "yyyy-MM-dd H:m:s";
const feed_urls = sourceList[source].feed_urls;
const currentTime = format(new Date(), timeFormat);
var feedBuildCount: number = 0;
for (const category in feed_urls) {
  const url = feed_urls[category];
  const md5Url = md5(url);
  console.log(`RSS processing ${url}`);
  let fetchFail = false;
  await fetch(url)
    .then(async (rssData) => {
      let data = await rssData.text();
      const options = {
        ignoreAttributes: false,
        attributeNamePrefix: ""
      };
      let parser = new XMLParser(options);
      let feed: RSSDetail = parser.parse(data);
      feed.rss.channel.item.forEach(async (news) => {
        if (news.title == undefined || (news.title == undefined && news.description == undefined)) {
          fetchFail = true
          console.log
          return
        }
        let feedBuilder = await FeedBuilder(category, news);
        console.log(feedBuilder);

        feedBuildCount += 1;
        console.log(feedBuildCount)
      })
    }).catch((err) => {
      console.log(`Error processing ${url} \n ${err}`)
      fetchFail = true;
    });
  if (fetchFail) {
    console.log(`Skipping RSS ${url}`);
    continue;
  }
}

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
console.log(feedBuildCount)
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
