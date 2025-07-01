import { VOICE_OPTIONS } from "@/constants";
import { formatDateTime } from "@/utils";

export default function RightSidebar({ currentVoice, changeVoice, status, call, isMuted, error, savedInterviewsInStorage, selectedConversation, viewConversation }: any) {
  return (
    <>
        <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm p-2">
        {/* Voice Selection */}
        <div className="w-full md:w-1/2 p-2">
            <div className="mb-2 p-2 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-700">Voice Settings</h3>
            <select 
                value={currentVoice.voiceId}
                onChange={(e) => changeVoice(VOICE_OPTIONS.find(v => v.voiceId === e.target.value)!)}
                className="w-full p-2 border rounded-md"
            >
                {VOICE_OPTIONS.map(voice => (
                <option key={voice.voiceId} value={voice.voiceId}>
                    {voice.voiceId}
                </option>
                ))}
            </select>
            </div>
        </div>

        {/* Status Indicator */}
        <div className="p-4 bg-blue-50 rounded-lg my-4">
            <div className="flex items-center justify-between gap-2 mb-2">
            <div className='flex items-center gap-2'>
                <div className={`w-3 h-3 rounded-full ${
                (status === 'active' || call) ? 'bg-green-500' : 
                status === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <span className="font-medium">
                {(status === 'active' || call) && 'Sona in progress'}
                {status === 'connecting' && 'Connecting...'}
                {(status === 'idle' && !call) && 'Ready to start'}
                </span>
            </div>
            &nbsp;&nbsp;&nbsp;
            <span>{isMuted ? 'Mic muted' : 'Mic is Unmuted'}</span>
            </div>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* History Section */}
        <div className="h-[calc(100vh-400px)] overflow-y-auto">
            <h3 className="font-semibold mb-3 text-gray-700">Past Sonas</h3>
            <div className="space-y-2">
            {savedInterviewsInStorage?.length > 0 ? (
                savedInterviewsInStorage?.map((conversation: any, index: number) => (
                <div
                    key={conversation.id + index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => viewConversation(conversation)}
                >
                    <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium text-gray-700">Sona Session #{index + 1}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(conversation?.dateCreated).fullDateTime} | {conversation.duration}</p>
                        <p className="text-xs text-gray-400">{conversation.messageCount} messages</p>
                    </div>
                    <button 
                        onClick={(e) => {
                        e.stopPropagation();
                        viewConversation(conversation);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                        View
                    </button>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center text-gray-500 text-sm py-4">
                No saved conversations yet.<br />
                Complete a conversation to view summary here.
                </div>
            )}
            </div>
        </div>
        </div>
    </>
  );
}
