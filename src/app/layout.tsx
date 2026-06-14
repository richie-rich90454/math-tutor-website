import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ConceptProvider } from "@/contexts/ConceptContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import SkipLink from "@/components/ui/SkipLink";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://math-tutor.ai";
const siteName = "AI Math Tutor";
const siteDescription =
    "Free AI-powered math tutoring with step-by-step explanations. Get instant help with algebra, geometry, calculus, trigonometry, statistics, and more. Personalized learning at any level.";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        template: `%s | ${siteName}`,
        default: `${siteName} — Free AI-Powered Math Help`,
    },
    description: siteDescription,
    keywords: [
        "math tutor",
        "AI math",
        "learn math",
        "math help",
        "algebra tutor",
        "geometry help",
        "calculus help",
        "trigonometry tutor",
        "statistics help",
        "online math tutor",
        "free math tutor",
        "step by step math",
        "math problem solver",
        "math practice",
        "homework help math",
        "AI homework helper",
    ],
    authors: [{ name: siteName, url: siteUrl }],
    creator: siteName,
    publisher: siteName,
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteUrl,
        siteName,
        title: `${siteName} — Free AI-Powered Math Help`,
        description: siteDescription,
        images: [
            {
                url: "/icon-512.svg",
                width: 512,
                height: 512,
                alt: `${siteName} logo — Sigma symbol`,
            },
        ],
    },
    twitter: {
        card: "summary",
        title: `${siteName} — Free AI-Powered Math Help`,
        description: siteDescription,
        images: ["/icon-512.svg"],
    },
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
    alternates: {
        canonical: siteUrl,
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    },
    category: "education",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
                <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Math Tutor" />
                <meta name="format-detection" content="telephone=no" />
                <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
                <link rel="apple-touch-icon" href="/icon-192.svg" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="canonical" href={siteUrl} />
                <Script
                    id="theme-script"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme');
                                    if (theme === 'light') {
                                        document.documentElement.setAttribute('data-theme', 'light');
                                    } else if (theme === 'dark') {
                                        document.documentElement.setAttribute('data-theme', 'dark');
                                    } else {
                                        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                                            document.documentElement.setAttribute('data-theme', 'dark');
                                        } else {
                                            document.documentElement.setAttribute('data-theme', 'light');
                                        }
                                    }
                                } catch(e) {}
                            })();
                        `,
                    }}
                />
                <Script
                    id="jsonld-webapp"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            name: siteName,
                            url: siteUrl,
                            description: siteDescription,
                            applicationCategory: "EducationalApplication",
                            operatingSystem: "All",
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "USD",
                            },
                            aggregateRating: {
                                "@type": "AggregateRating",
                                ratingValue: "4.8",
                                reviewCount: "128",
                            },
                        }),
                    }}
                />
                <Script
                    id="jsonld-org"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: siteName,
                            url: siteUrl,
                            description: siteDescription,
                            logo: `${siteUrl}/icon-512.svg`,
                            sameAs: [],
                        }),
                    }}
                />
                <Script
                    id="jsonld-faq"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: [
                                {
                                    "@type": "Question",
                                    name: "What math topics can the AI Math Tutor help with?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The AI Math Tutor covers algebra, geometry, calculus, trigonometry, statistics, arithmetic, fractions, equations, and more. It provides step-by-step explanations for problems at any level from elementary to college.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "Is the AI Math Tutor free?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Yes, the AI Math Tutor is completely free to use. Create a free account to save your chat history and access all features including step-by-step explanations and practice problems.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "How does the AI Math Tutor explain solutions?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The tutor provides detailed step-by-step breakdowns of each problem using clear language and proper mathematical notation (LaTeX). It adapts explanations to your level and can rephrase answers in different ways.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "Can I use the AI Math Tutor on my phone?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Yes, the AI Math Tutor works great on mobile devices. It has a responsive design that adapts to any screen size, and you can install it as a Progressive Web App (PWA) for quick access.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "What makes this different from other math tutors?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Our AI Math Tutor provides unlimited free help, supports multiple languages, saves your chat history, and gives detailed explanations that help you truly understand the concepts, not just get answers.",
                                    },
                                },
                            ],
                        }),
                    }}
                />
                <Script
                    id="jsonld-breadcrumb"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            itemListElement: [
                                {
                                    "@type": "ListItem",
                                    position: 1,
                                    name: "Home",
                                    item: siteUrl,
                                },
                            ],
                        }),
                    }}
                />
                <Script
                    id="jsonld-software"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            name: siteName,
                            operatingSystem: "Web",
                            applicationCategory: "EducationalApplication",
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "USD",
                            },
                            description: siteDescription,
                        }),
                    }}
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <script dangerouslySetInnerHTML={{ __html: `
                    window.addEventListener('error', function(e) {
                        console.error('Global error:', e.error);
                    });
                    window.addEventListener('unhandledrejection', function(e) {
                        console.error('Unhandled rejection:', e.reason);
                    });
                `}} />
                <ToastProvider>
                <AuthProvider>
                    <LanguageProvider>
                        <SkipLink />
                        <ConceptProvider>
                            <ChatProvider>{children}</ChatProvider>
                        </ConceptProvider>
                    </LanguageProvider>
                </AuthProvider>
                </ToastProvider>
            </body>
        </html>
    );
}