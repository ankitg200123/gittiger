export const dynamic = "force-static";

const BODY = `# GitTiger

> Daily ranking of trending AI and developer-tool repositories on GitHub, ordered by star velocity. Data is CC0.

## Trending score

score = stars_gained_24h² / ln(stars_total + 10)

Star gains come from the hourly GitHub public event archive. See /methodology.

## Pages

- [Home](https://gittiger.com/): today's trending repositories
- [Topics](https://gittiger.com/topics): trending by topic
- [Languages](https://gittiger.com/languages): trending by language
- [Rising](https://gittiger.com/rising): newly created repositories gaining fast
- [Hidden Gems](https://gittiger.com/hidden-gems): under 2,000 stars with strong momentum
- [Insights](https://gittiger.com/insights): analysis of the data
- [Weekly digests](https://gittiger.com/weekly)
- [Monthly digests](https://gittiger.com/monthly)
- [About](https://gittiger.com/about)
- [Methodology](https://gittiger.com/methodology)
- [Promote your project](https://gittiger.com/promote)
- [Advertise](https://gittiger.com/advertise)
- [Contact](https://gittiger.com/contact)

## Licensing

Rankings and aggregated statistics are CC0 1.0. Underlying repositories keep their own licenses.
`;

export function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
