import { useChat } from "../hooks/useChat";
import { useLanguage } from "../hooks/useLanguage";
import { MessageList } from "../components/MessageList";
import { InputArea } from "../components/InputArea";

export function Chat() {
    const { currentLang } = useLanguage();
    const { messages, isLoading, sendMessage } = useChat(undefined, currentLang);

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
