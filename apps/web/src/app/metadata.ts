import { Metadata } from "next";

export const domain = {
  https: "https://twoside.com",
  www: "www.twoside.com",
  full: "https://www.twoside.com",
  name: "twoside.com",
};

export const twosideWebsiteMetadata: Metadata = {
  // Basic SEO
  title: {
    default: "Twoside | Yield Without Impermanent Loss",
    template: "%s | Twoside",
  },
  description: `Twoside is a secure token locking utility where users lock their tokens
    and receive tradeable derivatives that can be redeemed 1:1.
    Maximize your DeFi strategy with flexible token management.`,

  // Keywords for SEO
  keywords: [
    "token locking",
    "cryptocurrency derivatives",
    "DeFi utility",
    "blockchain tokens",
    "crypto locking protocol",
    "derivative trading",
    "token redemption",
    "decentralized finance",
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
  publisher: "Twoside",
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
    siteName: "Twoside",
    title: "Twoside | Yield Without Impermanent Loss",
    description: `Secure token locking utility with 1:1 redeemable derivatives.
      Optimize your DeFi strategy with flexible token management.`,
    images: [
      {
        url: "/twoside-bold.png", // Create this image (1200x630px recommended)
        width: 1200,
        height: 630,
        alt: "Twoside | Yield Without Impermanent Loss",
        type: "image/png",
      },
      {
        url: "/twoside-bold.png", // Square version for some platforms
        width: 800,
        height: 800,
        alt: "Twoside Logo",
        type: "image/png",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Twoside | Yield Without Impermanent Loss",
    description:
      "Lock tokens, get derivatives, redeem 1:1. Flexible DeFi token management.",
    creator: "@TwosideOfficial", // Replace with your Twitter handle
    site: "@TwosideOfficial",
    images: ["/twoside-bold.png"], // 1200x600px recommended
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
        url: "/twoside.svg",
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
      // 'es-ES': 'https://Twoside.com/es',
    },
  },

  // Additional metadata
  applicationName: "Twoside",
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
  //     url: 'https://apps.apple.com/app/Twoside/id123456789',
  //     app_store_id: '123456789',
  //   },
  //   android: {
  //     url: 'https://play.google.com/store/apps/details?id=com.Twoside.app',
  //     package: 'com.Twoside.app',
  //   },
  // },

  // Apple-specific metadata
  // appleWebApp: {
  //   capable: true,
  //   title: "Twoside",
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
  // archives: ["https://web.archive.org/web/*/Twoside.com"],

  // // Assets preloading
  // assets: ["https://Twoside.com/fonts/custom-font.woff2"],

  // // Bookmarks (for bookmark apps)
  // bookmarks: ["https://Twoside.com/bookmark-icon.png"],

  // Additional metadata for web crawlers
  // other: {
  //   // Microsoft/Bing
  //   "application-name": "Twoside",
  //   "msapplication-TileColor": "#da532c",
  //   "msapplication-TileImage": "/mstile-144x144.png",
  //   "msapplication-config": "/browserconfig.xml",
  //   "msapplication-tooltip": "Twoside Token Locking Utility",
  //   "msapplication-starturl": "/",
  //   "msapplication-navbutton-color": "#da532c",

  //   // Mobile optimization
  //   "mobile-web-app-capable": "yes",
  //   "apple-mobile-web-app-capable": "yes",
  //   "apple-mobile-web-app-status-bar-style": "black-translucent",
  //   "apple-mobile-web-app-title": "Twoside",

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
  //   contact: "support@Twoside.com",
  //   copyright: "© 2025 Twoside. All rights reserved.",
  //   designer: "Twoside Design Team",
  //   owner: "Twoside Team",
  //   "reply-to": "support@Twoside.com",
  //   url: domain.https,
  //   "identifier-url": domain.https,
  //   directory: "submission",

  //   // Structured data hints
  //   "article:author": "Twoside Team",
  //   "article:publisher": "https://www.facebook.com/Twoside",
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
  name: "Twoside",
  description:
    "Token locking utility where users lock tokens and receive derivatives that can be redeemed 1:1",
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
    name: "Twoside Team",
  },
  featureList: [
    "Token Locking",
    "Derivative Generation",
    "1:1 Token Redemption",
  ],
};
