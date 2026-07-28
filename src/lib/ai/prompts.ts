import { promises as fs } from "fs";
import path from "path";

export const TOPIC_KEYWORDS: Record<string, string[]> = {
    algebra: [
        "algebra",
        "equation",
        "variable",
        "polynomial",
        "factor",
        "quadratic",
        "linear",
        "inequality",
        "matrix",
        "алгебр",
        "方程式",
        "الجبر",
        "algèbre",
        "Algebra",
    ],
    geometry: [
        "geometry",
        "angle",
        "triangle",
        "circle",
        "area",
        "perimeter",
        "volume",
        "surface",
        "parallel",
        "perpendicular",
        "геометр",
        "几何",
        "هندسة",
        "géométrie",
        "Geometrie",
    ],
    calculus: [
        "calculus",
        "derivative",
        "integral",
        "limit",
        "differentiation",
        "integration",
        "differential",
        "optimization",
        " calculus",
        "интеграл",
        "微积分",
        "حساب التفاضل",
        "calcul",
        "分析",
    ],
    trigonometry: [
        "trigonometry",
        "sine",
        "cosine",
        "tangent",
        "trig",
        "angle",
        "radian",
        "triangl",
        "тригонометр",
        "三角函数",
        "usul",
        "trigonométrie",
        "trigonometrie",
    ],
    statistics: [
        "statistics",
        "probability",
        "mean",
        "median",
        "standard deviation",
        "variance",
        "distribution",
        "sample",
        "статистик",
        "统计",
        "إحصاء",
        "statistique",
        "Statistik",
    ],
    arithmetic: [
        "addition",
        "subtraction",
        "multiplication",
        "division",
        "fraction",
        "decimal",
        "percentage",
        "arithmetic",
        "算术",
        "أithmetic",
        "arithmétique",
        "Arithmetik",
    ],
    "linear algebra": [
        "matrix",
        "vector",
        "eigenvalue",
        "linear transformation",
        "determinant",
        "span",
        "basis",
        "линейная алгебр",
        "线性代数",
        "جبر خطي",
        "algèbre linéaire",
        "Lineare Algebra",
    ],
    "number theory": [
        "prime",
        "divisibility",
        "modular",
        "congruence",
        "gcd",
        "lcm",
        "diophantine",
        "теория чисел",
        "数论",
        "نظرية الأعداد",
        "théorie des nombres",
    ],
    "differential equations": [
        "differential equation",
        "ode",
        "pde",
        "laplace",
        "fourier",
        "уравнение",
        "微分方程",
        "المعادلات التفاضلية",
        "équation différentielle",
        "Differentialgleichung",
    ],
    "word problems": [
        "word problem",
        "real world",
        "application",
        "scenario",
        "бодлог",
        "应用题",
        "مسألة",
        "problème",
        "Anwendung",
    ],
};

const PROMPTS_DIR = path.join(process.cwd(), "src/app/api/chat/prompts");
const SYSTEM_PROMPT_CACHE = new Map<string, string>();

const LANGUAGE_FILE_MAP: Record<string, string> = {
    zh: "prompt-zh-hant.txt",
    "zh-hans": "prompt-zh-hans.txt",
    "zh-hant": "prompt-zh-hant.txt",
    bo: "prompt-bo.txt",
    "mn-cyrl": "prompt-mn-cyrl.txt",
    "mn-mong": "prompt-mn-mong.txt",
    es: "prompt-es.txt",
    fr: "prompt-fr.txt",
    de: "prompt-de.txt",
    ja: "prompt-ja.txt",
    en: "prompt-en-us.txt",
};

const FALLBACK_PROMPT =
    "You are a friendly, patient math tutor. Explain math concepts clearly using LaTeX for formulas.\n" +
    "Use step-by-step reasoning. Break down complex problems. Be encouraging and positive.\n" +
    "Format inline math with $...$ and display math with $$...$$.";

export function extractTopic(message: string): string | null {
    const lower = message.toLowerCase();
    let bestTopic: string | null = null;
    let bestScore = 0;

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestTopic = topic;
        }
    }

    return bestTopic;
}

export async function getSystemPrompt(language: string): Promise<string> {
    const cached = SYSTEM_PROMPT_CACHE.get(language);
    if (cached) return cached;

    const fileName =
        LANGUAGE_FILE_MAP[language] || LANGUAGE_FILE_MAP.en || "prompt-en-us.txt";

    try {
        const filePath = path.join(PROMPTS_DIR, fileName);
        const content = await fs.readFile(filePath, "utf-8");
        SYSTEM_PROMPT_CACHE.set(language, content);
        return content;
    } catch {
        SYSTEM_PROMPT_CACHE.set(language, FALLBACK_PROMPT);
        return FALLBACK_PROMPT;
    }
}
