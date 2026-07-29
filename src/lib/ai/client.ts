export interface AIModel {
    name: string;
    streamChat(messages: { role: string; content: string }[]): Promise<ReadableStream<Uint8Array>>;
}
