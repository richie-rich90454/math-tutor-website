import { redirect } from "next/navigation";

export default function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
    const { topic } = await params;
    redirect(`/?topic=${encodeURIComponent(topic)}`);
}