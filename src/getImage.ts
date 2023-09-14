const axios = require("axios")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export async function getImage(feedUrl: string): Promise<string> {
  let imageUrl = '';

  try {
    const response = await axios.get(feedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
      },
    });

    const htmlContent = response.data;
    const dom = new JSDOM(htmlContent);

    const metaTags = dom.window.document.getElementsByTagName('meta');

    for (let i = 0; i < metaTags.length; i++) {
      const meta = metaTags[i];

      if (
        meta.hasAttribute('property') &&
        meta.getAttribute('property')?.toLowerCase() === 'og:image'
      ) {
        imageUrl = meta.getAttribute('content') || '';
        break;
      }
    }
  } catch (error) {
    console.error(
      `_get_image: ${feedUrl} : ${new Date().toISOString()} - ${error}`
    );
  }

  return imageUrl;
}
//module.exports = getImage

