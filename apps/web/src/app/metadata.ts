import { Metadata } from "next";

export const domain = {
  https: "https://buffcat.com",
  www: "www.buffcat.com",
  full: "https://www.buffcat.com",
  name: "buffcat.com",
};

export const buffcatWebsiteMetadata: Metadata = {
  // Basic SEO
  title: {
    default: "Buffcat | Earn Secondary Income From Your Tokens",
    template: "%s | Buffcat",
  },
  description: `Buffcat is a protocol for earning secondary income from your tokens.
    Lock tokens with flexible or fixed durations and claim daily rewards accumulated in Buffcat's reward pool.`,

  // Keywords for SEO
  keywords: [
    "secondary income",
    "token locking",
    "DeFi rewards",
    "reward pool",
    "crypto yield",
    "fixed lock",
    "flexible lock",
    "referral boost",
    "token management",
    "decentralized finance",
    "Buffcat",
  ],

  // Author and classification
  authors: [
    {
      name: "Arav Bhivgade",
      url: "https://www.linkedin.com/in/aravbhivgade/",
    },
    {
      name: "Anthony Pooler",
      url: "https://www.linkedin.com/in/anthony-pooler-27a842b5/",
    },
  ],
  creator: "Arav Bhivgade",
  publisher: "Buffcat",
  category: "DeFi",
  classification: "Financial Technology",

  // Robots and indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: domain.https, // Replace with your actual domain
    siteName: "Buffcat",
    title: "Buffcat | Earn Secondary Income From Your Tokens",
    description: `Earn secondary income from your tokens with Buffcat.
      Lock tokens for flexible or fixed durations and claim daily rewards boosted by lock duration, token diversity, and referrals.`,
    images: [
      {
        url: "/buffcat-bold.png", // Create this image (1200x630px recommended)
        width: 1200,
        height: 630,
        alt: "Buffcat | Earn Secondary Income From Your Tokens",
        type: "image/png",
      },
      {
        url: "/buffcat-bold.png", // Square version for some platforms
        width: 800,
        height: 800,
        alt: "Buffcat Logo",
        type: "image/png",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Buffcat | Earn Secondary Income From Your Tokens",
    description:
      "Lock tokens, earn secondary income, and claim boosted daily rewards from Buffcat's reward pool.",
    creator: "@BuffcatFinance",
    site: "@BuffcatFinance",
    images: ["/buffcat-bold.png"], // 1200x600px recommended
  },

  // Icons and visual branding
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "48x48", type: "image/png" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/buffcat.svg",
        color: "#5bbad5",
      },
    ],
  },

  // Web app manifest
  manifest: "/site.webmanifest",

  // Theme colors
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",

  // Verification tags (add these when you have them)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },

  // Alternative languages/regions (if applicable)
  alternates: {
    canonical: domain.https,
    languages: {
      "en-US": domain.https,
      // Add other languages if you support them
      // 'es-ES': 'https://Buffcat.com/es',
    },
  },

  // Additional metadata
  applicationName: "Buffcat",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Geographic targeting
  // geo: {
  //   region: 'US',
  //   placename: 'San Francisco',
  //   position: '37.7749,-122.4194',
  // },

  // App-specific metadata
  // appLinks: {
  //   ios: {
  //     url: 'https://apps.apple.com/app/Buffcat/id123456789',
  //     app_store_id: '123456789',
  //   },
  //   android: {
  //     url: 'https://play.google.com/store/apps/details?id=com.Buffcat.app',
  //     package: 'com.Buffcat.app',
  //   },
  // },

  // Apple-specific metadata
  // appleWebApp: {
  //   capable: true,
  //   title: "Buffcat",
  //   statusBarStyle: "default", // 'default' | 'black' | 'black-translucent'
  //   startupImage: [
  //     {
  //       url: "/apple-startup-640x1136.png",
  //       media:
  //         "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
  //     },
  //     {
  //       url: "/apple-startup-750x1334.png",
  //       media:
  //         "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
  //     },
  //     {
  //       url: "/apple-startup-1242x2208.png",
  //       media:
  //         "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
  //     },
  //   ],
  // },

  // // Archive/Wayback Machine
  // archives: ["https://web.archive.org/web/*/Buffcat.com"],

  // // Assets preloading
  // assets: ["https://Buffcat.com/fonts/custom-font.woff2"],

  // // Bookmarks (for bookmark apps)
  // bookmarks: ["https://Buffcat.com/bookmark-icon.png"],

  // Additional metadata for web crawlers
  // other: {
  //   // Microsoft/Bing
  //   "application-name": "Buffcat",
  //   "msapplication-TileColor": "#da532c",
  //   "msapplication-TileImage": "/mstile-144x144.png",
  //   "msapplication-config": "/browserconfig.xml",
  //   "msapplication-tooltip": "Buffcat Token Locking Utility",
  //   "msapplication-starturl": "/",
  //   "msapplication-navbutton-color": "#da532c",

  //   // Mobile optimization
  //   "mobile-web-app-capable": "yes",
  //   "apple-mobile-web-app-capable": "yes",
  //   "apple-mobile-web-app-status-bar-style": "black-translucent",
  //   "apple-mobile-web-app-title": "Buffcat",

  //   // Content/Page specific
  //   "content-language": "en-US",
  //   "page-topic": "DeFi Token Management",
  //   "page-type": "website",
  //   audience: "crypto investors, DeFi users",
  //   coverage: "worldwide",
  //   distribution: "global",
  //   rating: "general",
  //   subject: "cryptocurrency, blockchain, DeFi, token locking",
  //   summary: "Secure token locking utility with derivative generation",

  //   // Caching directives
  //   "cache-control": "public, max-age=31536000",
  //   expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),

  //   // Security
  //   "referrer-policy": "strict-origin-when-cross-origin",

  //   // Social/Business info
  //   contact: "support@Buffcat.com",
  //   copyright: "© 2025 Buffcat. All rights reserved.",
  //   designer: "Buffcat Design Team",
  //   owner: "Buffcat Team",
  //   "reply-to": "support@Buffcat.com",
  //   url: domain.https,
  //   "identifier-url": domain.https,
  //   directory: "submission",

  //   // Structured data hints
  //   "article:author": "Buffcat Team",
  //   "article:publisher": "https://www.facebook.com/Buffcat",
  //   "article:section": "Technology",
  //   "article:tag": "DeFi, Cryptocurrency, Token Locking",

  //   // Pinterest
  //   "p:domain_verify": "your-pinterest-verification-code",

  //   // Yandex (Russian search engine)
  //   "yandex-verification": "your-yandex-verification-code",

  //   // Bing/Microsoft
  //   "msvalidate.01": "your-bing-verification-code",

  //   // Baidu (Chinese search engine)
  //   "baidu-site-verification": "your-baidu-verification-code",

  //   // Naver (Korean search engine)
  //   "naver-site-verification": "your-naver-verification-code",

  //   // Custom business/app metadata
  //   "app-version": "1.0.0",
  //   "build-version": "1.0.0",
  //   "api-version": "v1",
  //   "last-modified": new Date().toISOString(),
  // },
};

// Optional: Add structured data with JSON-LD
export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Buffcat",
  description:
    "Protocol enabling users to earn secondary income by locking tokens with flexible or fixed durations and claiming daily rewards.",
  url: domain.https,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "Buffcat Team",
  },
  featureList: [
    "Token Locking (Fixed & Flexible)",
    "Secondary Income Daily Rewards",
    "Reward Pool Claiming & Boosts",
  ],
};
