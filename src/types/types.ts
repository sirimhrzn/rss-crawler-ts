export type SourceDetails = {
  [key: string]: {
    feed_urls: {
      busi?: string;
      sprt?: string;
      entm?: string;
      hlth?: string;
      tops?: string;
      wrld?: string;
      pltc?: string;
    },
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
  "media:thumbnail"?: {
    url?: string;
  },
  image?: {
    url?: string;
  },
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
