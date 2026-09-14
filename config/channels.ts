import type { ChannelConfig } from "@/types";

// ============================================================
// 금융사 YouTube 모니터링 대상 채널
// ============================================================

export const CHANNELS: ChannelConfig[] = [
  // ---------- 생명보험 ----------
  {
    companyName: "삼성생명",
    channelName: "삼성생명",
    category: "생명보험",
    youtubeChannelId: "UCAgkMrESCDJbgqS8zPHboTw",
  },
  {
    companyName: "한화생명",
    channelName: "한화생명",
    category: "생명보험",
    youtubeChannelId: "UCpA6wY9xIh7IHUziGnd9kdg",
  },
  {
    companyName: "신한라이프",
    channelName: "신한라이프",
    category: "생명보험",
    youtubeChannelId: "UCMgKAjyrvXcfuGTLDHTdwkQ",
  },
  {
    companyName: "한화생명 LIFEPLUS",
    channelName: "LIFEPLUS TV",
    category: "생명보험",
    youtubeChannelId: "UCpdOk5frWC7HqSvpuc_9MUQ",
  },
  {
    companyName: "KB라이프생명",
    channelName: "KB라이프생명",
    category: "생명보험",
    youtubeChannelId: "UCrKJwnv6-psXk6AMDg5zX7A",
  },

  // ---------- 손해보험 ----------
  {
    companyName: "삼성화재",
    channelName: "삼성화재",
    category: "손해보험",
    youtubeChannelId: "UCffY-gSI6eOHHS2Z146o4qQ",
  },
  {
    companyName: "현대해상",
    channelName: "현대해상",
    category: "손해보험",
    youtubeChannelId: "UCLdiWtQQZvuj4u15COsjnJg",
  },
  {
    companyName: "하나손해보험",
    channelName: "하나TV [하나손해보험]",
    category: "손해보험",
    youtubeChannelId: "UCuec1ICnb9fsDegXpyIbPHw",
  },
  {
    companyName: "KB손해보험",
    channelName: "KB손해보험",
    category: "손해보험",
    youtubeChannelId: "UCWDLm80rnSGH84Wg1BCIHBQ",
  },
  {
    companyName: "메리츠화재",
    channelName: "메리츠화재",
    category: "손해보험",
    youtubeChannelId: "UCqnmhJo2CEquIdxM7WIutFQ",
  },
  {
    companyName: "DB손해보험",
    channelName: "DB손해보험다이렉트",
    category: "손해보험",
    youtubeChannelId: "UCE8RRAGHOhjyFtLa3Tahe0g",
  },

  // ---------- 금융그룹 ----------
  {
    companyName: "KB금융그룹",
    channelName: "KB금융그룹",
    category: "금융그룹",
    youtubeChannelId: "UCZ_xAP42i9KMUKZbomB6JSQ",
  },
  {
    companyName: "신한금융그룹",
    channelName: "신한금융그룹",
    category: "금융그룹",
    youtubeChannelId: "UCJSNpKmXlsTc5bP33X3kz6A",
  },
  {
    companyName: "하나금융그룹",
    channelName: "하나TV [하나금융그룹]",
    category: "금융그룹",
    youtubeChannelId: "UCejh7cdlFSkCh_rqQT6WB8Q",
  },
  {
    companyName: "우리금융그룹",
    channelName: "우리금융그룹",
    category: "금융그룹",
    youtubeChannelId: "UCM0hZUXs-2aXM9Ik3vfUEAA",
  },

  // ---------- 은행 ----------
  {
    companyName: "KB국민은행",
    channelName: "KB국민은행",
    category: "은행",
    youtubeChannelId: "UCHq8auIJ8ewo7iD2pqX22UA",
  },
  {
    companyName: "신한은행",
    channelName: "신한은행",
    category: "은행",
    youtubeChannelId: "UC4E394G9WuS9y6SlBZslMsQ",
  },
  {
    companyName: "하나은행",
    channelName: "하나TV [하나은행]",
    category: "은행",
    youtubeChannelId: "UCSHbm2TrspNZ_p_yd39kMNg",
  },
  {
    companyName: "우리은행",
    channelName: "우리은행",
    category: "은행",
    youtubeChannelId: "UCcQ9V6nEYVMSRWWOrvHQqLg",
  },
  {
    companyName: "NH농협은행",
    channelName: "NH농협은행",
    category: "은행",
    youtubeChannelId: "UCmkkFJIalgnWovxFigYK2EA",
  },

];

export function getUnresolvedChannels(): ChannelConfig[] {
  return CHANNELS.filter((c) =>
    c.youtubeChannelId.startsWith("REPLACE_WITH")
  );
}