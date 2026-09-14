import { CHANNELS } from "../config/channels";

const apiKey = process.env.YOUTUBE_API_KEY;

if (!apiKey) {
  console.error("YOUTUBE_API_KEY가 없습니다. .env.local을 확인해주세요.");
  process.exit(1);
}

async function searchChannel(query: string) {
  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet&type=channel&maxResults=5&q=${encodeURIComponent(query)}` +
    `&key=${apiKey}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API 오류 ${res.status}: ${text}`);
  }

  const data = await res.json();

  return (data.items ?? []).map((item: any) => ({
    channelId: item.snippet?.channelId ?? item.id?.channelId ?? "",
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
  }));
}

async function main() {
  for (const channel of CHANNELS) {
    if (!channel.youtubeChannelId.startsWith("REPLACE_WITH")) {
      console.log(`\n✅ ${channel.companyName} - 이미 등록됨`);
      console.log(`   ${channel.youtubeChannelId}`);
      continue;
    }

    const query =
      channel.channelName && channel.channelName !== channel.companyName
        ? `${channel.companyName} ${channel.channelName}`
        : channel.companyName;

    console.log(`\n========================================`);
    console.log(`🔎 ${channel.companyName}`);
    console.log(`검색어: ${query}`);
    console.log(`========================================`);

    try {
      const results = await searchChannel(query);

      if (results.length === 0) {
        console.log("검색 결과 없음");
        continue;
      }

      results.forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   Channel ID: ${result.channelId}`);
        console.log(
          `   설명: ${result.description.slice(0, 120).replace(/\n/g, " ")}`
        );
      });
    } catch (error) {
      console.error("검색 실패:", error);
    }
  }
}

main();
