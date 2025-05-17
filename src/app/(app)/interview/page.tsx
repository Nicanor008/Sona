'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { vapi } from '@/lib/vapi';

export default function InterviewPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startInterview = async () => {
    setIsLoading(true);
    try {
      await vapi.start({
        model: 'gpt-4-turbo',
        voice: 'steve',
        endCallFunctionEnabled: true,
        // Add your webhook config here
      });
      setIsCallActive(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopInterview = async () => {
    await vapi.stop();
    setIsCallActive(false);
  };

  useEffect(() => {
    const onMessageUpdate = (message: any) => {
      if (message.transcript) {
        setTranscript(message.transcript);
      }
    };

    vapi.on('message', onMessageUpdate);

    return () => {
      vapi.off('message', onMessageUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Mock Interview</h1>
          
          <div className="h-64 mb-8 p-4 bg-gray-100 rounded-lg overflow-y-auto">
            {transcript || (
              <p className="text-gray-500 italic">
                Your interview transcript will appear here...
              </p>
            )}
          </div>

          <div className="flex justify-center">
            {isCallActive ? (
              <button
                onClick={stopInterview}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <MicOff size={20} /> End Interview
              </button>
            ) : (
              <button
                onClick={startInterview}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">Tips for your interview:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Speak clearly and at a moderate pace</li>
              <li>Use the STAR method for behavioral questions</li>
              <li>Take a moment to think before answering</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
