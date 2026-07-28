import { redirect } from "next/navigation";

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
    const { topic } = await params;
    redirect(`/?topic=${encodeURIComponent(topic)}`);
}