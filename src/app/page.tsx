'use client';

import { useState, useEffect, useRef } from 'react';
import vapi from '@/lib/vapi';
import { formatDateTime, generateUUID } from '@/utils';
import { SavedConversation, TranscriptMessage } from '@/types';
import { VOICE_OPTIONS } from '@/constants';
import RightSidebar from '@/components/RightSidebar';
import MessageCard from '@/components/Messages/MessageCard';
import MessageControls from '@/components/Messages/MessageControls';

export default function InterviewPage() {
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<any>(VOICE_OPTIONS[0]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SavedConversation | null>(null);

  const [savedInterviewsInStorage, setSavedInterviewsInStorage] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('savedInterviews');
    if (stored) {
      setSavedInterviewsInStorage(JSON.parse(stored));
    }
  }, []);

  // Store ongoing message IDs to maintain consistency
  const [ongoingMessageIds, setOngoingMessageIds] = useState<{[key: string]: string}>({});
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    console.log('Starting interview...');
    setIsLoading(true);
    setStatus('connecting');
    setMessages([]); // Clear messages immediately
    setSelectedConversation(null); // Clear any viewed conversation
    setConversationStartTime(Date.now()); // Set start time
    
    try {
      setTimeout(async () => {
        const newCall = await (vapi as any).start({
          model: {
            provider: 'openai',
            model: 'gpt-4-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a friendly and engaging interactive storyteller AI. Your job is to welcome the user warmly, explain that you have a vast collection of exciting, mysterious, funny, and adventurous stories, and ask them what kind of story they would like to hear today. Use a fun and imaginative tone to spark their curiosity.`
              }
            ]
          },
          voice: currentVoice,
          transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'en-US'
          },
          firstMessage: `Hi there, adventurer! I'm your AI storyteller with tales from every corner of imagination—mysteries, fantasies, comedies, and more! So, what kind of story are you in the mood for today? Something magical, spooky, heroic, or maybe downright silly? I'm all ears!`
        });
        // messages: [
        //       {
        //         role: 'system',
        //         content: 'You are a professional job interview coach. Begin by welcoming the candidate and asking them to introduce themselves. Keep questions concise and professional.'
        //       }
        //     ]
        //   },
        //   voice: currentVoice,
        //   transcriber: {
        //     provider: 'deepgram',
        //     model: 'nova-2',
        //     language: 'en-US'
        //   },
        //   firstMessage: 'Welcome to your mock interview. To get started, could you please introduce yourself and tell me about your professional background?'
        // });

        setCall(newCall);
        setStatus('active');
      }, 1000);
      
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
      id: generateUUID(),
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
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Panel - Chat Area */}
          <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sona
                </h1>
                <p className='text-gray-600 text-sm'>Speak. Listen. Imagine.</p>
              </div>
            </div>

            {selectedConversation && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Viewing conversation from {formatDateTime(selectedConversation?.dateCreated).fullDateTime} 
                  ({selectedConversation?.duration}, {selectedConversation?.messageCount} messages)
                </p>
              </div>
            )}
            
            {/* Transcript Container */}
            <MessageCard
              selectedConversation={selectedConversation}
              messages={messages}
              transcriptEndRef={transcriptEndRef}
            />

            {/* Controls */}
            <MessageControls
              call={call}
              isMuted={isMuted}
              toggleMute={toggleMute}
              stopInterview={stopInterview}
              startInterview={startInterview}
              isLoading={isLoading}
              status={status}
            />
          </div>

          {/* Right Panel - Settings */}
          <RightSidebar
            currentVoice={currentVoice}
            changeVoice={changeVoice}
            status={status}
            call={call}
            isMuted={isMuted}
            error={error}
            savedInterviewsInStorage={savedInterviewsInStorage}
            selectedConversation={selectedConversation}
            viewConversation={viewConversation}
          />
        </div>
      </div>
    </div>
  );
}
