'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import vapi from '@/lib/vapi';
import Image from 'next/image';

interface TranscriptMessage {
  id: string;
  text: string;
  role: 'user' | 'system' | 'assistant';
  isFinal: boolean;
}

interface Voice {
  provider: string;
  voiceId: string;
}

const VOICE_OPTIONS: Voice[] = [
  { provider: 'playht', voiceId: 'jennifer' },
  { provider: 'playht', voiceId: 'michael' },
];

export default function InterviewPage() {
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<Voice>(VOICE_OPTIONS[0]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const startInterview = async () => {
    console.log('Starting interview...');
    setIsLoading(true);
    setStatus('connecting');
    setMessages([]); // Clear messages immediately
    
    try {
      const newCall = await vapi.start({
        model: {
          provider: 'openai',
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional job interview coach. Begin by welcoming the candidate and asking them to introduce themselves. Keep questions concise and professional.'
            },
            {
              role: 'assistant',
              content: 'Welcome to your mock interview. To get started, could you please introduce yourself and tell me about your professional background?'
            }
          ]
        },
        voice: currentVoice,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        },
        firstMessage: 'Welcome to your mock interview. To get started, could you please introduce yourself and tell me about your professional background?'
      });
      setCall(newCall);
      setStatus('active');
      
      // Force the first message to appear immediately
      setMessages(prev => [...prev, {
        id: 'initial-' + Date.now(),
        text: 'Welcome to your mock interview. To get started, could you please introduce yourself and tell me about your professional background?',
        role: 'assistant',
        isFinal: true
      }]);
      
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start interview');
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };
  
  const stopInterview = async () => {
    setIsMuted(!isMuted);
    vapi.stop();
    setCall(null);
  };
  
  const toggleMute = () => {
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };
  
  const changeVoice = (voice: typeof VOICE_OPTIONS[0]) => {
    setCurrentVoice(voice);
  };
  
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'transcript' || message.type === 'partial-transcript') {
        const role = message.role || (message.speaker === 'user' ? 'user' : 'assistant');
        const isFinal = message.type === 'transcript';
        
        setMessages(prev => {
          // Find the latest non-final message from the same role
          const lastMessageIndex = [...prev].reverse().findIndex(msg => 
            msg.role === role && !msg.isFinal);
          
          // If no existing message is found or it's already final, add a new one
          if (lastMessageIndex === -1 || isFinal) {
            // Remove previous non-final messages from the same role if this is the final version
            const filteredMessages = isFinal 
              ? prev.filter(msg => !(msg.role === role && !msg.isFinal)) 
              : prev;
              
            return [
              ...filteredMessages,
              {
                id: `${role}-${Date.now()}`,
                text: message.transcript,
                role,
                isFinal
              }
            ];
          }
          
          // Update the existing non-final message
          const actualIndex = prev.length - 1 - lastMessageIndex;
          const updatedMessages = [...prev];
          updatedMessages[actualIndex] = {
            ...updatedMessages[actualIndex],
            text: message.transcript,
            isFinal
          };
          
          return updatedMessages;
        });
      }
    };
    
    const handleCallEnd = () => {
      setCall(null);
      setStatus('idle')
    };
    
    const handleError = (error: any) => {
      setStatus('idle');
      setError(error?.message || 'Connection failed');
      console.error('Vapi error:', error);
    };
    
    vapi.on('message', handleMessage);
    vapi.on('call-end', handleCallEnd);
    vapi.on('error', handleError);
    
    return () => {
      vapi.removeAllListeners();
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Panel - Chat Area */}
          <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm p-4">
            <h1 className="text-xl font-bold text-center mb-2 text-gray-800">Witiview - <span className='text-gray-600 text-lg'>Mock Interview</span></h1>
            
            {/* Transcript Container */}
            <div className="h-[calc(100vh-200px)] mb-1 p-2 bg-gray-100 rounded-lg overflow-y-auto">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => (
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
                        {!message.isFinal && (
                          <div className="text-xs opacity-70 mt-1">
                            {message.role === 'user' ? 'Speaking...' : 'Thinking...'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="relative w-full h-full max-w-2xl mx-auto">
                    <Image 
                      src="/images/bot-interview.png" 
                      alt="AI Interview Illustration"
                      fill
                      className="object-contain rounded-xl opacity-82"
                      priority
                    />
                  </div>
                  <p className="text-gray-500 italic text-center mt-4">
                    Start the interview to begin your practice session, and your transcript will appear here.
                  </p>
                </div>
              )}
            </div>
            {/* Controls */}
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
                    {isLoading ? (
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
          </div>
          {/* Right Panel - Settings */}
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
                    {(status === 'active' || call) && 'Interview in progress'}
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
              <h3 className="font-semibold mb-3 text-gray-700">Session History</h3>
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-700">Interview #{item}</p>
                        <p className="text-sm text-gray-500">2024-03-{10 + item} | 25 minutes</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
