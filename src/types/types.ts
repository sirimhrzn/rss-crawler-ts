export type SourceDetails = {
  [key: string]: {
    feed_urls: Partial<Record<Category, string>>,
    tier_config: {
      interval_value: string;
      slug: string;
    }
  }
}
export type News = {
  title: string;
  description: string;
  content: string;
  link: string;
  source: string;
  category: string;
  image: string;
  uuid: string;
  guid: string;
  author: string;
  fetch_date: string;
  pub_date: string;
  update_date: string;
}
export type NewsItem = {
  title: string;
  description: string;
  "content:encoded"?: string;

  link: string;
  guid?: {
    "#text"?: string;
  } | string;
  "dc:creator"?: string;
  pubDate: string;
}
export type RSSDetail = {
  rss: {
    channel: {
      title: string;
      link: string;
      description: string;
      item: NewsItem[];
    };
  };
}
// export type Category = "busi" | "sprt" | "hlth" | "oths" | "pltc" | "tops" | "entm" | "wrld";
export const categoryArray = ["busi", "sprt", "hlth", "oths", "pltc", "tops", "entm", "wrld", "tops"];
export type Category = typeof categoryArray[number];



export type State = {
  [key: string]: {
    [key in Category]: string;
  };
}
export type Feed = {
  title: string;
  description: string;
  content: string;
  link: string;
  source: string;
  category: string;
  image: string;
  uuid: string;
  fetch_date: string;
  pub_date: string;
  update_date: string;
  is_syndicated: string;
}
//  "media:thumbnail"?: {
//   url?: string;
//  },
//  image?: {
//  url?: string;
//  },
