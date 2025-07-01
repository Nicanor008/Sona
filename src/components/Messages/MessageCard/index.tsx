import Image from "next/image";

export default function MessageCard({ selectedConversation, messages, transcriptEndRef }: any) {
    return (
        <div className="h-[calc(100vh-200px)] mb-1 p-2 bg-gray-100 rounded-lg overflow-y-auto">
            {(messages?.length > 0 || selectedConversation?.interview?.length > 0) ? (
            <div className="space-y-3">
                {(selectedConversation ? selectedConversation.interview : messages)?.map((message: any) => (
                <div 
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.role === 'assistant'
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-purple-100 text-purple-800'
                    }`}
                    >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                </div>
                ))}
                <div ref={transcriptEndRef} />
            </div>
            ) : (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="relative w-full h-full max-w-2xl mx-auto">
                <Image
                    src="/images/bot-interview-3.png" 
                    alt="AI Interview Illustration"
                    fill
                    className="object-contain opacity-92"
                    priority
                />
                </div>
                <p className="text-gray-700 italic text-center mt-4">
                Start a Sona and interact in the virtual world.
                </p>
            </div>
            )}
        </div>
    )
}
