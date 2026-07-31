import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(128),
    remember: z.boolean().optional(),
});

export const signupSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(100),
});

export const chatMessageSchema = z.object({
    message: z.string().min(1).max(4000),
    chatId: z.string().nullable().optional(),
    preferredLanguage: z.string().max(10).optional(),
});

export const chatImageSchema = z.object({
    image: z.string().min(1),
    mimeType: z.string().min(1),
    message: z.string().max(4000),
    preferredLanguage: z.string().max(10).optional(),
    chatId: z.string().nullable().optional(),
});

export const createChatSchema = z.object({
    title: z.string().min(1).max(200),
    preview: z.string().max(500).optional(),
});

export const updateChatSchema = z.object({
    title: z.string().max(200).optional(),
    preview: z.string().max(500).optional(),
    topic: z.string().max(100).optional(),
});
