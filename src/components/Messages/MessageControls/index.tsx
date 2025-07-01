import { Loader2, Mic, MicOff } from "lucide-react";

export default function MessageControls({ call, isMuted, toggleMute, stopInterview, startInterview, isLoading, status }: any) {
    return (
        <div className="sticky bottom-0 bg-white pt-4">
            <div className="flex justify-center gap-2 flex-wrap">
            {call ? (
                <>
                <button
                    onClick={toggleMute}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isMuted ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition-colors`}
                >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                <button
                    onClick={stopInterview}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    <MicOff size={18} />
                    <span className="hidden sm:inline">End</span>
                </button>
                </>
            ) : (
                <button
                onClick={startInterview}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                {isLoading || status === 'connecting' ? (
                    <>
                    <Loader2 size={20} className="animate-spin" /> Starting...
                    </>
                ) : (
                    <>
                    <Mic size={20} /> Start Interview
                    </>
                )}
                </button>
            )}
            </div>
        </div>
    )
}
