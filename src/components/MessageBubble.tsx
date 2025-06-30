
import { Timestamp } from "firebase/firestore";

interface Message {
    id: string;
    text: string;
    timestamp: Timestamp | null;
}

interface MessageBubbleProps {
    message: Message;
    isCurrentUser: boolean;
}

const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    try {
        return timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

const MessageBubble = ({ message, isCurrentUser }: MessageBubbleProps) => {
    const bubbleClasses = isCurrentUser
        ? 'bg-blue-600 text-white self-end'
        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 self-start';
    
    const containerClasses = isCurrentUser
        ? 'justify-end'
        : 'justify-start';

    return (
        <div className={`flex w-full ${containerClasses} my-1 animate-in fade-in duration-300`}>
            <div className={`rounded-xl px-3 py-2 max-w-sm md:max-w-md shadow-sm ${bubbleClasses}`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'} text-right`}>
                    {formatTime(message.timestamp)}
                </p>
            </div>
        </div>
    );
};

export default MessageBubble;
