import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ConceptProvider } from "@/contexts/ConceptContext";
import { AuthProvider } from "@/contexts/AuthContext";

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

export const metadata: Metadata = {
    title: {
        template: "%s | AI Math Tutor",
        default: "AI Math Tutor — Learn Math with AI",
    },
    description:
        "Personalized AI-powered math tutoring. Get step-by-step explanations, practice problems, and instant help with algebra, geometry, calculus, and more. Powered by advanced AI.",
    keywords: [
        "math tutor",
        "AI math",
        "learn math",
        "math help",
        "algebra tutor",
        "geometry help",
        "calculus tutor",
        "online math tutor",
        "step-by-step math",
        "math practice",
    ],
    authors: [{ name: "AI Math Tutor" }],
    creator: "AI Math Tutor",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://math-tutor.ai",
        siteName: "AI Math Tutor",
        title: "AI Math Tutor — Learn Math with AI",
        description:
            "Personalized AI-powered math tutoring. Get step-by-step explanations and instant help.",
    },
    twitter: {
        card: "summary_large_image",
        title: "AI Math Tutor — Learn Math with AI",
        description:
            "Personalized AI-powered math tutoring. Get step-by-step explanations and instant help.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme');
                                    if (theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                        document.documentElement.setAttribute('data-theme', 'dark');
                                    } else {
                                        document.documentElement.setAttribute('data-theme', 'light');
                                    }
                                } catch(e) {}
                            })();
                        `,
                    }}
                />
                <link rel="preload" href="/_next/static/media/" as="font" crossOrigin="anonymous" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            name: "AI Math Tutor",
                            description:
                                "Personalized AI-powered math tutoring with step-by-step explanations.",
                            applicationCategory: "EducationalApplication",
                            operatingSystem: "All",
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "USD",
                            },
                        }),
                    }}
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <AuthProvider>
                    <LanguageProvider>
                        <ConceptProvider>
                            <ChatProvider>{children}</ChatProvider>
                        </ConceptProvider>
                    </LanguageProvider>
                </AuthProvider>
            </body>
        </html>
    );
}