import { Elysia } from "elysia";
import { RSSDetail, News, SourceDetails, NewsItem, State, Category, categoryArray, BITVALUES, Categories } from "./types/types";
import { XMLParser } from 'fast-xml-parser';
import { format } from 'date-fns';
import * as cheerio from 'cheerio';
import { getImage } from "./getImage"
const md5 = require('md5');
const { v4: uuidv4 } = require('uuid');
import * as cassandra from 'cassandra-driver';
const { Sequelize } = require('sequelize');

import mysql from "mysql2";

var con = mysql.createConnection({
  host: "172.26.0.2",
  user: "siri",
  password: "siri",
  database: "news"
});
con.connect(function(err) {
  if (err) {

    console.log(`${err.message}`)
  } else {
    console.log("Connected!");
  }

});
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
const getDB = () => {
  let data = con.query("select feeds.id, title, feeds.description,feeds.content,feeds.raw_content,link,source,category,bit_value,author,image,
    uuid, fetch_date, pub_date, update_date, encloser_url, encloser_type, is_syndicated, syndicate_percent from feeds JOIN sources
    ON feeds.source = sources.code WHERE feeds.pub_date < now() AND feeds.pub_date > '2023-09-13 00:00:00' AND feeds.id > (select min(id) from feeds where category = 'busi' AND pub_date between '2023-09-13 00:00:00' AND '2023-09-13 23:59:59') AND
  `feeds`.`category` = 'busi' AND sources.lang = 'NP' AND module_bit_value & 1 = 1 order by feeds.pub_date desc limit 10",function(err,result){
  return result;
})
};

//const source = "FRDH";
const timeFormat = "yyyy-MM-dd H:m:s";
//const feed_urls = sourceList[source].feed_urls;
const currentTime = format(new Date(), timeFormat);
const STATEJSON = "state.json";

let stateJSON = Bun.file(STATEJSON);
var feedBuildCount: number = 0;

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
          let feedBuilding: News = await FeedBuilder(category as Categories, source, news);
          let sql = `INSERT INTO feeds(title,description,content,link,source,category,bit_value,author,image,uuid,guid,fetch_date,pub_date,update_date)
VALUES("${feedBuilding.title}","${feedBuilding.description}","${feedBuilding.content}","${feedBuilding.link}","${feedBuilding.source}","${feedBuilding.category}","${feedBuilding.bit_value}","
${feedBuilding.author}","${feedBuilding.image}","${feedBuilding.uuid}","${feedBuilding.guid}","${feedBuilding.fetch_date}","${feedBuilding.pub_date}","${feedBuilding.update_date}"
)`;
          con.query(sql, function(err, result) {
            if (err) {
              console.log(err)
            }
            console.log(`[${currentTime}] ${feedBuilding.title} has been inserted into db`)
          })
        })
      }).catch((err) => {
        console.log(`[${currentTime}]Error processing ${url} ${err}`)
        fetchFail = true;
      });
    if (fetchFail) {
      console.log(`[${currentTime}] Skipping RSS ${url} `);
      fetchFail = false
      continue;
    }

    if (etag !== '' || dataExists) {
      if (!state[source] && etag == '') {
        console.log(`[${currentTime}] no etag for ${source} - ${category}`)
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
      console.log(`[${currentTime}] Adding ${source} with etag to ${STATEJSON} `)
    }

  }
  if (feedBuildCount > 10) {
    break;
  }
}
async function FeedBuilder(category: Categories, source: string, news: NewsItem): Promise<News> {
  let strippedContent = news["content:encoded"] ? cheerio.load(news["content:encoded"]).text() ?? "" : "";
  let strippedDescription = news.description ? cheerio.load(news.description).text() ?? "" : "";
  let imageurl = await getImage(news.link);
  feedBuildCount += 1;
  return {
    title: news.title,
    description: strippedDescription,
    content: strippedContent,
    image: imageurl,
    link: news.link,
    source: source,
    bit_value: BITVALUES[category],
    category: category,
    uuid: uuidv4(),
    guid: news.guid["#text"] ?? news.guid ?? "",
    author: news["dc:creator"] ?? "",
    fetch_date: currentTime,
    pub_date: format(new Date(news.pubDate), timeFormat) ?? currentTime,
    update_date: currentTime,
  }
}
console.log(feedBuildCount)
const wordChecker = (title: string, word: string): boolean => {
  return title.includes(word)
}
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} `
);
