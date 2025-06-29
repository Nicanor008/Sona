'use client';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Save } from 'lucide-react';
import vapi from '@/lib/vapi';
import Image from 'next/image';
import { formatDateTime } from '@/lib/formatDateTime';

interface TranscriptMessage {
  id: string;
  text?: string;
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

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface SavedConversation {
  id: string;
  date: string;
  duration: string;
  messages: TranscriptMessage[];
  startTime: number;
  endTime?: number;
}

  const interviewsInStorage = localStorage.getItem('savedInterviews');

export default function InterviewPage() {
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<Voice>(VOICE_OPTIONS[0]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SavedConversation | null>(null);

  const savedInterviewsInStorage = interviewsInStorage ? JSON.parse(interviewsInStorage) : [];

  // Store ongoing message IDs to maintain consistency
  const [ongoingMessageIds, setOngoingMessageIds] = useState<{[key: string]: string}>({});
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // useEffect(() => {

  // }, [interviewsInStorage])
  
  const startInterview = async () => {
    console.log('Starting interview...');
    setIsLoading(true);
    setStatus('connecting');
    setMessages([]); // Clear messages immediately
    setSelectedConversation(null); // Clear any viewed conversation
    setConversationStartTime(Date.now()); // Set start time
    
    try {
      setTimeout(async () => {
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
        
        // Force the first message to appear immediately with a consistent UUID
        const initialMessageId = generateUUID();
        setMessages(prev => [...prev, {
          id: initialMessageId,
          text: 'Welcome to your mock interview. To get started, could you please introduce yourself and tell me about your professional background?',
          role: 'assistant',
          isFinal: false
        }]);
      }, 1500);
      
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start interview');
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const stopInterview = async () => {
    vapi.stop();
    setCall(null);
   if (conversationStartTime && messages.length > 1) {
      saveConversation();
    }
  };
  
  const toggleMute = () => {
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };
  
  const changeVoice = (voice: typeof VOICE_OPTIONS[0]) => {
    setCurrentVoice(voice);
  };

  // Fixed save conversation function
  const saveConversation = () => {
    const endTime = Date.now();
    const durationMinutes = conversationStartTime ? Math.round((endTime - conversationStartTime) / 1000 / 60) : 0

    // Get existing saved interviews or initialize as empty array

    const interviewDetails = {
      id: 1,
      dateCreated: Date.now(),
      startTime: conversationStartTime,
      endTime: endTime,
      duration: durationMinutes > 0 ? `${durationMinutes} min` : '< 1 min',
      messageCount: messages.length,
      interview: messages // Create a copy of the messages array
    };

    const updatedConversations = [interviewDetails, ...savedInterviewsInStorage]

    // Save updated array back to localStorage
    localStorage.setItem('savedInterviews', JSON.stringify(updatedConversations));

    // Reset conversation tracking
    setConversationStartTime(null);
  };

  const viewConversation = (conversation: SavedConversation) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages);
  };

  const returnToLive = () => {
    setSelectedConversation(null);
    if (!call) {
      setMessages([]); // Clear messages if no active call
    }
  };

  const manualSaveConversation = () => {
    // saveConversation();
  };
  // console.log('..............SAved mess....', localStorage.getItem('savedInterviews'));
  
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'transcript' || message.transcriptType === 'partial') {
        const role = message.role || (message.speaker === 'user' ? 'user' : 'assistant');
        const transcript = message.transcript;
        
        setMessages(prev => {
          // For partial messages, try to update the latest non-final message from the same role
          if (message.transcriptType === 'partial') {
            const roleKey = `${role}-ongoing`;
            
            // Get or create ongoing message ID
            let messageId = ongoingMessageIds[roleKey];
            if (!messageId) {
              messageId = generateUUID();
              setOngoingMessageIds(prevIds => ({
                ...prevIds,
                [roleKey]: messageId
              }));
            }
            
            // Find existing ongoing message
            const existingMessage = prev.some(msg => (msg.isFinal === false && msg.role === role) || msg.id === messageId);
            const existingIndex = prev.findIndex(msg => msg.id === messageId);
            
            if (existingMessage) {
              // Update existing message
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                text: transcript,
                isFinal: false
              };
              return updated;
            } else {
              // Add new ongoing message
              return [...prev, {
                id: messageId,
                text: transcript,
                role,
                isFinal: false
              }];
            }
          } else {
            // For final messages, check if we have an ongoing message to finalize
            const roleKey = `${role}-ongoing`;
            const ongoingId = ongoingMessageIds[roleKey];
            
            if (ongoingId) {
              // Clear the ongoing ID
              setOngoingMessageIds(prevIds => {
                const newIds = { ...prevIds };
                delete newIds[roleKey];
                return newIds;
              });
              
              // Update the ongoing message to final
              const existingIndex = prev.findIndex(msg => msg.id === ongoingId);
              if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  text: transcript,
                  isFinal: true
                };
                return updated;
              }
            }
            
            // For final messages without ongoing message, check for duplicates
            // Don't add if we already have this exact message from the same role
            const isDuplicate = prev.some(msg => 
              msg.role === role && 
              msg.text === transcript 
            );
            
            if (!isDuplicate) {
              return [...prev, {
                id: generateUUID(),
                text: transcript,
                role,
                isFinal: true
              }];
            }
            
            return prev;
          }
        });
      }
    };
    
    const handleCallEnd = () => {
      setCall(null);
      setStatus('idle');
      setOngoingMessageIds({}); // Clear ongoing message IDs
      // if (conversationStartTime && messages.length > 1) {
      //   saveConversation();
      // }
    };
    
    const handleError = (error: any) => {
      setStatus('idle');
      setError(error?.message || 'Connection failed');
      setOngoingMessageIds({}); // Clear ongoing message IDs
      console.error('Vapi error:', error);
    };
    
    vapi.on('message', handleMessage);
    vapi.on('call-end', handleCallEnd);
    vapi.on('error', handleError);
    
    return () => {
      vapi.removeAllListeners();
    };
  }, [ongoingMessageIds,  conversationStartTime, messages, selectedConversation]);

  console.log('.............saved....', savedInterviewsInStorage)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Panel - Chat Area */}
          <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm p-4">
            {/* <h1 className="text-xl font-bold text-center mb-2 text-gray-800">Witiview - <span className='text-gray-600 text-lg'>Mock Interview</span></h1> */}
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-gray-800">
                Witiview - <span className='text-gray-600 text-lg'>Mock Interview</span>
              </h1>
              <div className="flex gap-2">
                {selectedConversation && (
                  <button
                    onClick={returnToLive}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Back to Live
                  </button>
                )}
                {call && conversationStartTime && messages.length > 1 && (
                  <button
                    onClick={manualSaveConversation}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    <Save size={14} />
                    Save
                  </button>
                )}
              </div>
            </div>

            {selectedConversation && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Viewing conversation from {selectedConversation.date} 
                  ({selectedConversation.duration}, {selectedConversation.messageCount} messages)
                </p>
              </div>
            )}
            
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
                      className="object-contain opacity-92"
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
              <h3 className="font-semibold mb-3 text-gray-700">Past Interviews</h3>
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
                          <p className="font-medium text-gray-700">Interview Session #{index + 1}</p>
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
                    Complete an interview to see it here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
