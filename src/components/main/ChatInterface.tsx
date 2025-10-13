import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { documentService } from '../../services/api';

const ChatInterface: React.FC = () => {
  const { messages, addMessage, isLoading } = useChat();
  const { documents } = useDocuments();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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
      // Call real RAG API
      const response = await documentService.chat(input);
      
      // Add assistant message with real response
      addMessage({
        id: Date.now() + 1,
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources.map((source: any) => ({
          name: source.filename || source.title,
          relevance: 0.95 // You can calculate this based on search scores
        }))
      });
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      addMessage({
        id: Date.now() + 1,
        type: 'assistant',
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
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to DocuMind Chat
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask questions about your uploaded documents. I'll provide answers based on the content you've shared.
            </p>
            {documents.length === 0 && (
              <p className="text-sm text-amber-600 mt-4">
                Upload some documents first to get started!
              </p>
            )}
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
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-lg rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-white to-gray-50 text-gray-900 shadow-md border border-gray-200'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Sources:</p>
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-700">
                        <span className="font-medium">{source.name}</span>
                        <span className="text-gray-500 ml-1">
                          ({Math.round(source.relevance * 100)}% match)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg px-4 py-2 shadow-md border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <Send className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;