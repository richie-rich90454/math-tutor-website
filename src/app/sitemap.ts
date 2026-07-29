import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://math-tutor.ai";

    const staticPages = [
        { path: "", priority: 1, freq: "weekly" as const },
        { path: "/login", priority: 0.6, freq: "monthly" as const },
        { path: "/signup", priority: 0.7, freq: "monthly" as const },
        { path: "/settings", priority: 0.5, freq: "monthly" as const },
    ];

    // Topic landing pages for SEO
    const topicPages = [
        "algebra",
        "geometry",
        "calculus",
        "trigonometry",
        "statistics",
        "arithmetic",
        "fractions",
        "equations",
    ];

    const allPages = [
        ...staticPages.map((p) => ({
            url: p.path ? `${baseUrl}${p.path}` : baseUrl,
            lastModified: new Date(),
            changeFrequency: p.freq,
            priority: p.priority,
        })),
        ...topicPages.map((topic) => ({
            url: `${baseUrl}/topics/${topic}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
    ];

    return allPages;
}
