import { useChat } from "../hooks/useChat";
import { MessageList } from "../components/MessageList";
import { InputArea } from "../components/InputArea";

export function Chat() {
    const { messages, isLoading, sendMessage } = useChat();

    return (
        <div class="chat-view">
            <MessageList messages={messages} isLoading={isLoading} />
            <div class="chat-input-bar">
                <div class="chat-input-bar-inner">
                    <InputArea onSend={sendMessage} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
