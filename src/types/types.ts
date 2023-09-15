
export type Categories = "busi" | "sprt" | "hlth" | "oths" | "pltc" | "tops" | "entm" | "wrld";
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
  bit_value: string;
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

export const categoryArray = ["busi", "sprt", "hlth", "oths", "pltc", "tops", "entm", "wrld", "tops"];
export type Category = typeof categoryArray[number];
export type CategoryBitValue = {
  [key in Categories]: string;
}


export type State = {
  [key: string]: {
    [key in Category]: string;
  };
}

export const BITVALUES: CategoryBitValue = {
  busi: 4,
  tops: 1,
  pltc: 2,
  sprt: 32,
  entm: 128,
  hlth: 8,
  oths: 512,
  wrld: 64

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
