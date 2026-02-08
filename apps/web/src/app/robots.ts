import { MetadataRoute } from "next";
import { domain } from "./metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google Search (Googlebot)
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/tmp/",
          "/_next/",
          "/sitemap.xml", // Let it find sitemap through robots.txt instead
        ],
        crawlDelay: 1, // 1 second delay between requests
      },

      // Google Images
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/images/",
          "/assets/",
          "*.png",
          "*.jpg",
          "*.jpeg",
          "*.gif",
          "*.svg",
          "*.webp",
        ],
        disallow: ["/admin/", "/private/", "/user-uploads/"],
      },

      // Google News
      {
        userAgent: "Googlebot-News",
        allow: ["/news/", "/blog/", "/announcements/"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Google Video
      {
        userAgent: "Googlebot-Video",
        allow: ["/", "/videos/", "*.mp4", "*.webm", "*.mov"],
        disallow: ["/admin/", "/private/"],
      },

      // Bing Search (Bingbot)
      {
        userAgent: "bingbot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/", "/tmp/", "/_next/"],
        crawlDelay: 2,
      },

      // Yahoo Search (Slurp)
      {
        userAgent: "Slurp",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/", "/tmp/"],
        crawlDelay: 2,
      },

      // DuckDuckGo
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 1,
      },

      // Yandex (Russian search engine)
      {
        userAgent: "YandexBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/", "/tmp/"],
        crawlDelay: 3,
      },

      // Baidu (Chinese search engine)
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/", "/tmp/"],
        crawlDelay: 5, // Baidu can be aggressive
      },

      // Sogou (Chinese search engine)
      {
        userAgent: "Sogou",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 3,
      },

      // Naver (Korean search engine)
      {
        userAgent: "NaverBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 2,
      },

      // Facebook (for link previews)
      {
        userAgent: "facebookexternalhit",
        allow: ["/", "/og-image.png", "/twitter-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Twitter/X (for card previews)
      {
        userAgent: "Twitterbot",
        allow: ["/", "/og-image.png", "/twitter-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // LinkedIn
      {
        userAgent: "LinkedInBot",
        allow: ["/", "/og-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // WhatsApp
      {
        userAgent: "WhatsApp",
        allow: ["/", "/og-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Telegram
      {
        userAgent: "TelegramBot",
        allow: ["/", "/og-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Discord
      {
        userAgent: "Discordbot",
        allow: ["/", "/og-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Slack
      {
        userAgent: "Slackbot",
        allow: ["/", "/og-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Apple (for Siri, Spotlight)
      {
        userAgent: "Applebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 1,
      },

      // Amazon Alexa
      {
        userAgent: "ia_archiver", // Alexa's web crawler
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 2,
      },

      // Internet Archive Wayback Machine
      {
        userAgent: "ia_archiver",
        allow: "/",
        disallow: ["/admin/", "/private/", "/tmp/"],
      },

      // Pinterest
      {
        userAgent: "Pinterest",
        allow: ["/", "*.jpg", "*.png", "*.gif", "*.webp"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // Reddit
      {
        userAgent: "Snoo", // Reddit's bot
        allow: ["/", "/og-image.png", "*.jpg", "*.png"],
        disallow: ["/api/", "/admin/", "/private/"],
      },

      // SEMrush (SEO tool)
      {
        userAgent: "SemrushBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 5,
      },

      // Ahrefs (SEO tool)
      {
        userAgent: "AhrefsBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 5,
      },

      // Moz (SEO tool)
      {
        userAgent: "MozBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 3,
      },

      // Archive.today
      {
        userAgent: "archive.org_bot",
        allow: "/",
        disallow: ["/admin/", "/private/"],
      },

      // CCBot (Common Crawl)
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
        crawlDelay: 2,
      },

      // ChatGPT/OpenAI (for training data)
      {
        userAgent: "ChatGPT-User",
        disallow: "/", // Block AI training by default
      },

      // OpenAI GPTBot
      {
        userAgent: "GPTBot",
        disallow: "/", // Block AI training
      },

      // Anthropic Claude
      {
        userAgent: "Claude-Web",
        disallow: "/", // Block AI training
      },

      // Perplexity AI
      {
        userAgent: "PerplexityBot",
        disallow: "/", // Block AI training
      },

      // Common Crawl (used for AI training)
      {
        userAgent: "CCBot",
        disallow: "/", // Block AI training datasets
      },

      // Scrapers and bad bots (block these)
      {
        userAgent: [
          "SemrushBot",
          "AhrefsBot",
          "MJ12bot",
          "DotBot",
          "SiteAuditBot",
          "BLEXBot",
          "YandexBot", // Can be aggressive
          "Bytespider", // TikTok/ByteDance crawler
          "PetalBot", // Huawei search
          "DataForSeoBot",
          "proximic",
          "VelenPublicWebCrawler",
        ],
        disallow: "/",
        crawlDelay: 86400, // 1 day delay (essentially blocking)
      },

      // Default rule for all other bots
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/tmp/",
          "/_next/",
          "/user-uploads/",
          "*.json",
          "/sitemap_index.xml", // Hide from general crawling
        ],
        crawlDelay: 2,
      },
    ],

    // Sitemap location
    sitemap: [
      `${domain.https}/sitemap.xml`,
      `${domain.https}/sitemap-0.xml`, // If you have multiple sitemaps
      `${domain.https}/news-sitemap.xml`, // News sitemap if applicable
      `${domain.https}/image-sitemap.xml`, // Image sitemap if applicable
    ],

    // Host directive (choose your preferred domain)
    host: `${domain.https}`, // Preferred domain (without www)
  };
}
