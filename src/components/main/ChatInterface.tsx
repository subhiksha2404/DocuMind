import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Save, Check } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { documentService } from '../../services/api';

interface ChatInterfaceProps {
  connectionStatus: 'agentic' | 'langgraph' | 'error';
  currentSessionId?: string | null; // 🔥 ADD THIS PROP
  onSessionChange?: (sessionId: string | null) => void; // 🔥 ADD THIS PROP
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  connectionStatus, 
  currentSessionId, // 🔥 RECEIVE THE PROP
  onSessionChange // 🔥 RECEIVE THE PROP
}) => {
  const { messages, addMessage, isLoading } = useChat();
  const { documents } = useDocuments();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [internalSessionId, setInternalSessionId] = useState<string | null>(currentSessionId || null); // 🔥 INTERNAL STATE

  // 🔥 SYNC EXTERNAL SESSION ID WITH INTERNAL STATE
  useEffect(() => {
    setInternalSessionId(currentSessionId || null);
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Save chat to history
  const saveChatToHistory = async () => {
    if (messages.length === 0) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      let sessionId = internalSessionId;
      
      // Create new session if none exists
      if (!sessionId) {
        const firstMessage = messages.find(m => m.type === 'user')?.content || 'New Chat';
        const title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
        
        const newSession = await documentService.createChatSession(title);
        sessionId = newSession.id;
        setInternalSessionId(sessionId);
        
        // 🔥 NOTIFY PARENT ABOUT NEW SESSION
        if (onSessionChange) {
          onSessionChange(sessionId);
        }
      }
      
      // Save all messages to session
      for (const message of messages) {
        await documentService.addChatMessage(sessionId!, {
          role: message.type,
          content: message.content,
          sources: message.sources
        });
      }
      
      console.log('💾 Chat saved to history');
      setSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save chat:', error);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: input,
      timestamp: new Date()
    };
    addMessage(userMessage);

    setInput('');

    try {
      // Always use LangGraph now
      console.log('🚀 Using LangGraph agent system...');
      const response = await documentService.chat(input);
      
      console.log('🤖 Chat response received:', response);

      // Add assistant message with real response
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant' as const,
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources.map((source: any) => ({
          name: source.filename || source.title,
          relevance: 0.95
        }))
      };
      
      addMessage(assistantMessage);

      // Auto-save to chat history after successful response
      setTimeout(saveChatToHistory, 1000);

    } catch (error) {
      console.error('Chat error:', error);
      
      addMessage({
        id: Date.now() + 1,
        type: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      });
    } 
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
      {/* Connection Status Bar */}
      <div className={`px-4 py-2 text-xs text-center flex justify-between items-center ${
        connectionStatus === 'langgraph' ? 'bg-purple-100 text-purple-800 border-b border-purple-200' :
         connectionStatus === 'error' ? 'bg-red-100 text-red-800 border-b border-red-200' :
        'bg-green-100 text-green-800 border-b border-green-200'
      }`}>
        <span>
          {connectionStatus === 'langgraph' && '🚀 Using LangGraph Agent System'}
          {connectionStatus === 'error' && '❌ Connection Issues - Please try again'}
          {connectionStatus === 'agentic' && '🚀 Using LangGraph Agent System'}
        </span>
        
        {/* Save Chat Button */}
        {messages.length > 0 && (
          <button
            onClick={saveChatToHistory}
            disabled={isSaving || saveStatus === 'saving'}
            className="flex items-center space-x-1 px-2 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-70 transition-colors disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Save Chat</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to DocuMind Chat
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Ask questions about your uploaded documents. I'll search through all indexed documents to provide answers.
            </p>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <button
                onClick={() => setInput("What is professional ethics?")}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                What is professional ethics?
              </button>
              <button
                onClick={() => setInput("Explain active range finding")}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
              >
                Explain active range finding
              </button>
              <button
                onClick={() => setInput("Compare CNN and RNN")}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
              >
                Compare CNN and RNN
              </button>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>💡 <strong>Tips for better answers:</strong></p>
              <p>• Ask specific questions about your documents</p>
              <p>• Use complete sentences for better understanding</p>
              <p>• Try rephrasing if you don't get good results</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-3 animate-fadeIn ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md border border-gray-200'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Sources:</p>
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-700 flex items-center">
                        <span className="font-medium">{source.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({Math.round(source.relevance * 100)}% match)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-lg px-4 py-3 shadow-md border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* Empty space for alignment */}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 transition-all duration-200"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md shadow-blue-500/25 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </button>
        </form>
        
        {/* Quick suggestions when input is empty */}
        {!input.trim() && messages.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Try asking:</span>
            <button
              onClick={() => setInput("What are the main topics in my documents?")}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              What are the main topics?
            </button>
            <button
              onClick={() => setInput("Summarize the key concepts")}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              Summarize key concepts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;