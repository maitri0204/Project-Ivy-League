'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import mammoth from 'mammoth';

function InlineDocViewer({ url, onClose }: { url: string, onClose: () => void }) {
  const fullUrl = `http://localhost:5000${url}`;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="mt-4 relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 animate-in fade-in zoom-in-95 duration-300">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="min-h-[500px] flex items-center justify-center bg-gray-800">
        {isImage ? (
          <img src={fullUrl} alt="Document" className="max-w-full max-h-[800px] object-contain" />
        ) : (
          <iframe src={fullUrl} className="w-full h-[600px] border-none" title="Document Viewer" />
        )}
      </div>
    </div>
  );
}

// Word Document Viewer Component
function WordDocViewer({ url }: { url: string }) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        setError(null);
      } catch (err) {
        console.error('Error loading Word document:', err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-red-50 rounded">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="w-full max-h-96 overflow-y-auto bg-white p-4 rounded border border-gray-200"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <style jsx global>{`
        .word-doc-content p, .word-doc-content h1, .word-doc-content h2, .word-doc-content h3, 
        .word-doc-content h4, .word-doc-content h5, .word-doc-content h6, .word-doc-content li,
        .word-doc-content span, .word-doc-content div, .word-doc-content td, .word-doc-content th {
          color: #1f2937 !important;
        }
        .word-doc-content h1, .word-doc-content h2, .word-doc-content h3 {
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
        }
        .word-doc-content p {
          margin-bottom: 0.75rem !important;
          line-height: 1.6 !important;
        }
      `}</style>
      <div 
        className="word-doc-content text-gray-800"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

// Conversation Window Component
function ConversationWindow({ 
  activityTitle, 
  task, 
  activityId,
  studentIvyServiceId,
  onClose 
}: { 
  activityTitle: string; 
  task: DocumentTask; 
  activityId: string;
  studentIvyServiceId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageType, setMessageType] = useState<'normal' | 'advice' | 'resource'>('normal');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFileType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video';
    if (['pdf'].includes(ext || '')) return 'pdf';
    return 'document';
  };

  const handleFileClick = (url: string, name: string) => {
    const fileType = getFileType(name);
    const fullUrl = `http://localhost:5000${url}`;
    console.log('Opening file preview:', { url, fullUrl, name, type: fileType });
    setPreviewFile({ url: fullUrl, name, type: fileType });
  };

  // Fetch conversation messages from API
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/task/conversation', {
          params: {
            selectionId: activityId,
            taskTitle: task.title,
            taskPage: task.page,
          },
        });
        if (response.data.success) {
          setMessages(response.data.data.messages || []);
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [activityId, task.title, task.page]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;

    try {
      const formData = new FormData();
      formData.append('studentIvyServiceId', studentIvyServiceId);
      formData.append('selectionId', activityId);
      formData.append('taskTitle', task.title);
      formData.append('taskPage', String(task.page));
      formData.append('sender', 'student');
      formData.append('senderName', 'You');
      formData.append('text', newMessage.trim() || ' ');
      formData.append('messageType', messageType === 'normal' ? 'normal' : messageType === 'advice' ? 'feedback' : messageType === 'resource' ? 'resource' : 'normal');
      
      if (attachedFile) {
        formData.append('file', attachedFile);
      }

      const response = await axios.post('http://localhost:5000/api/task/conversation/message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessages(response.data.data.messages || []);
        setNewMessage('');
        setAttachedFile(null);
        setMessageType('normal');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{activityTitle}</h2>
              <p className="text-sm text-gray-500">Pointer: Spike</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Student Perspective</span>
            </div>
            <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors uppercase tracking-wide">
              Live View
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${msg.sender === 'student' ? 'order-2' : 'order-1'}`}>
                  {msg.messageType === 'feedback' && msg.sender === 'student' ? (
                    // Advice message from student
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Advice</span>
                      </div>
                      {msg.text.trim() && <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>}
                      {msg.attachment && (
                        <div 
                          onClick={() => handleFileClick(msg.attachment!.url, msg.attachment!.name)}
                          className={`${msg.text.trim() ? 'mt-3' : ''} p-3 bg-white rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
                        >
                          <div className="p-2 bg-green-100 rounded">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{msg.attachment.name}</p>
                            <p className="text-xs text-gray-500">{msg.attachment.size}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : msg.messageType === 'feedback' && msg.sender === 'counselor' ? (
                    // Feedback message from counselor
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z"/>
                        </svg>
                        <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Feedback</span>
                      </div>
                      {msg.text.trim() && <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>}
                      {msg.attachment && (
                        <div 
                          onClick={() => handleFileClick(msg.attachment!.url, msg.attachment!.name)}
                          className={`${msg.text.trim() ? 'mt-3' : ''} p-3 bg-white rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
                        >
                          <div className="p-2 bg-yellow-100 rounded">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{msg.attachment.name}</p>
                            <p className="text-xs text-gray-500">{msg.attachment.size}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : msg.messageType === 'resource' && msg.sender === 'student' ? (
                    // Resource message from student
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Resource</span>
                      </div>
                      {msg.text.trim() && <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>}
                      {msg.attachment && (
                        <div 
                          onClick={() => handleFileClick(msg.attachment!.url, msg.attachment!.name)}
                          className={`${msg.text.trim() ? 'mt-3' : ''} p-3 bg-white rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
                        >
                          <div className="p-2 bg-indigo-100 rounded">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{msg.attachment.name}</p>
                            <p className="text-xs text-gray-500">{msg.attachment.size}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : msg.messageType === 'action' && msg.sender === 'counselor' ? (
                    // Action message from counselor
                    <div className="bg-white border-2 border-purple-200 rounded-lg p-4 mb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Action Suggested</span>
                      </div>
                      {msg.text.trim() && <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>}
                      {msg.attachment && (
                        <div 
                          onClick={() => handleFileClick(msg.attachment!.url, msg.attachment!.name)}
                          className={`${msg.text.trim() ? 'mt-3' : ''} p-3 bg-purple-50 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-purple-100 transition-colors`}
                        >
                          <div className="p-2 bg-purple-100 rounded">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{msg.attachment.name}</p>
                            <p className="text-xs text-gray-500">{msg.attachment.size}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : msg.messageType === 'resource' && msg.sender === 'counselor' ? (
                    // Resource message from counselor
                    <div className="bg-white border-2 border-indigo-200 rounded-lg p-4 mb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Resource</span>
                      </div>
                      {msg.text.trim() && <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>}
                      {msg.attachment && (
                        <div 
                          onClick={() => handleFileClick(msg.attachment!.url, msg.attachment!.name)}
                          className={`${msg.text.trim() ? 'mt-3' : ''} p-3 bg-indigo-50 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition-colors`}
                        >
                          <div className="p-2 bg-indigo-100 rounded">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{msg.attachment.name}</p>
                            <p className="text-xs text-gray-500">{msg.attachment.size}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular message
                    <div className={`rounded-2xl px-4 py-3 ${msg.sender === 'student' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      {msg.text.trim() && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                      {msg.attachment && (
                        <div 
                          onClick={() => handleFileClick(msg.attachment!.url, msg.attachment!.name)}
                          className={`${msg.text.trim() ? 'mt-3' : ''} p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity ${msg.sender === 'student' ? 'bg-blue-400/30' : 'bg-white'}`}
                        >
                          <div className={`p-2 rounded ${msg.sender === 'student' ? 'bg-blue-400' : 'bg-red-100'}`}>
                            <svg className={`w-5 h-5 ${msg.sender === 'student' ? 'text-white' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${msg.sender === 'student' ? 'text-white' : 'text-gray-900'}`}>
                              {msg.attachment.name}
                            </p>
                            <p className={`text-xs ${msg.sender === 'student' ? 'text-blue-100' : 'text-gray-500'}`}>
                              {msg.attachment.size}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p className={`text-xs text-gray-500 mt-1 ${msg.sender === 'student' ? 'text-right' : 'text-left'}`}>
                    {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
          {/* Message Type Tabs */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setMessageType('normal')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                messageType === 'normal'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setMessageType('advice')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                messageType === 'advice'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Advice
            </button>
            <button
              onClick={() => setMessageType('resource')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                messageType === 'resource'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resource
            </button>
          </div>
          {attachedFile && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{attachedFile.name}</p>
                <p className="text-xs text-gray-500">{(attachedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            {/* Photos/Videos Upload Button */}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setAttachedFile(file);
                };
                input.click();
              }}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach photo or video"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Files Upload Button */}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setAttachedFile(file);
                };
                input.click();
              }}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach file"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !attachedFile}
              className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-6xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{previewFile.name}</h3>
              </div>
              
              <div className="p-4 max-h-[calc(90vh-100px)] overflow-auto">
                {previewFile.type === 'image' && (
                  <img src={previewFile.url} alt={previewFile.name} className="max-w-full h-auto mx-auto" />
                )}
                {previewFile.type === 'video' && (
                  <video src={previewFile.url} controls className="max-w-full h-auto mx-auto" />
                )}
                {previewFile.type === 'pdf' && (
                  <iframe src={previewFile.url} className="w-full h-[calc(90vh-150px)]" title={previewFile.name} />
                )}
                {previewFile.type === 'document' && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DocumentTask {
  title: string;
  page?: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface CounselorDocument {
  url: string;
  tasks: DocumentTask[];
}

interface StudentActivity {
  selectionId: string;
  suggestion?: { _id: string; title: string; description: string; tags: string[] };
  pointerNo: number;
  title: string;
  description: string;
  tags: string[];
  selectedAt: string;
  weightage?: number; // Weightage for Pointers 2, 3, 4
  counselorDocuments?: CounselorDocument[]; // Documents with tasks
  proofUploaded: boolean;
  submission: {
    _id: string;
    files: string[];
    remarks?: string;
    submittedAt: string;
  } | null;
  evaluated: boolean;
  evaluation: {
    _id: string;
    score: number;
    feedback?: string;
    evaluatedAt: string;
  } | null;
}

function ActivitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId');
  const studentIvyServiceId = searchParams.get('studentIvyServiceId');

  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activePointer, setActivePointer] = useState<number>(() => {
    const p = searchParams.get('pointerNo');
    return p ? parseInt(p) : 2;
  });
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingCounselorDocUrl, setViewingCounselorDocUrl] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<{ activityTitle: string; task: DocumentTask; activityId: string } | null>(null);

  // Update URL when conversation opens/closes
  const handleTaskClick = (activityTitle: string, task: DocumentTask, activityId: string) => {
    setSelectedTask({ activityTitle, task, activityId });
    const params = new URLSearchParams(window.location.search);
    params.set('conversationOpen', 'true');
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseConversation = () => {
    setSelectedTask(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('conversationOpen');
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const p = searchParams.get('pointerNo');
    if (p) {
      setActivePointer(parseInt(p));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/pointer/activity/student/${studentId}`
        );
        if (response.data.success) {
          // API returns { data: { activities: [...] } }
          const payload = response.data.data;
          const rawActivities = payload && Array.isArray(payload.activities) ? payload.activities : [];

          const activitiesData = rawActivities.map((act: any) => ({
            ...act,
            title: act.suggestion?.title || 'Untitled Activity',
            description: act.suggestion?.description || '',
            tags: act.suggestion?.tags || []
          }));

          setActivities(activitiesData);
        }
      } catch (error: any) {
        console.error('Error fetching activities:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load activities';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [studentId]);

  const handleProofUpload = async (
    selectedActivityId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    setUploadingProof(selectedActivityId);
    setMessage(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('proofFiles', file);
      });
      formData.append('studentIvyServiceId', studentIvyServiceId);
      formData.append('counselorSelectedSuggestionId', selectedActivityId);
      formData.append('studentId', studentId);

      const response = await axios.post(
        'http://localhost:5000/api/pointer/activity/proof/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Proof uploaded successfully!' });
        // Refetch activities after a short delay to ensure backend has saved
        setTimeout(async () => {
          try {
            const refreshResponse = await axios.get(
              `http://localhost:5000/api/pointer/activity/student/${studentId}`
            );
            if (refreshResponse.data.success) {
              const payload = refreshResponse.data.data;
              const rawActivities = payload && Array.isArray(payload.activities) ? payload.activities : [];
              const activitiesData = rawActivities.map((act: any) => ({
                ...act,
                title: act.suggestion?.title || 'Untitled Activity',
                description: act.suggestion?.description || '',
                tags: act.suggestion?.tags || []
              }));
              setActivities(activitiesData);
            }
          } catch (error) {
            console.error('Error refreshing activities:', error);
            window.location.reload();
          }
        }, 500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload proof';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingProof(null);
    }
  };

  const getPointerLabel = (pointerNo: number): string => {
    switch (pointerNo) {
      case 2:
        return 'Pointer 2: Spike in One Area';
      case 3:
        return 'Pointer 3: Leadership & Initiative';
      case 4:
        return 'Pointer 4: Global & Social Impact';
      default:
        return `Pointer ${pointerNo}`;
    }
  };

  if (!studentId) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-red-100 p-8">
          <div className="bg-red-50 text-red-800 border border-red-200 p-6 rounded-2xl font-bold uppercase tracking-tight text-center">
            Student ID is required. Please provide studentId as a query parameter.
          </div>
        </div>
      </div>
    );
  }

  const filteredActivities = activities.filter(a => a.pointerNo === activePointer);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Tasks List Section */}
      <div className={`transition-all duration-300 ${selectedTask ? 'w-[35%]' : 'w-full'} overflow-y-auto`}>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 p-10 mt-6">
        <div className="mb-10 pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">My Activities</h1>
            <p className="text-gray-500 font-medium mt-1">Proof submission and tracking.</p>
          </div>
          <div className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 ${activePointer === 2 ? 'border-blue-100 bg-blue-50 text-blue-700' : activePointer === 3 ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${activePointer === 2 ? 'bg-blue-500' : activePointer === 3 ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
            <span className="font-bold uppercase tracking-wider">{getPointerLabel(activePointer)}</span>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading activities...</div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p>No activities assigned for {getPointerLabel(activePointer)} yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((activity) => (
              <div
                key={activity.selectionId}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">{activity.title}</h3>
                    {activity.weightage !== undefined && activity.weightage !== null && (
                      <div className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-400 rounded-lg">
                        <span className="text-sm font-bold text-orange-900">Weightage: {activity.weightage}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {getPointerLabel(activity.pointerNo)}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {activity.description}
                  </p>
                  {activity.tags && activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activity.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Counselor Documents with Tasks - View Only */}
                {activity.counselorDocuments && activity.counselorDocuments.length > 0 && (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                    <p className="text-sm font-medium text-indigo-900 mb-3"> Guides & Tasks from Counselor</p>
                    <div className="space-y-4">
                      {activity.counselorDocuments.map((doc, docIdx) => {
                        const isPdf = doc.url.toLowerCase().endsWith('.pdf');
                        const isWord = doc.url.toLowerCase().endsWith('.doc') || doc.url.toLowerCase().endsWith('.docx');
                        const isViewing = viewingCounselorDocUrl === doc.url;
                        
                        return (
                          <div key={docIdx} className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                            {/* Document Header */}
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
                              <span className="text-sm text-gray-800 font-semibold">📎 Activity Guide {docIdx + 1}</span>
                              <button
                                onClick={() => setViewingCounselorDocUrl(isViewing ? null : doc.url)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isViewing ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {isViewing ? 'Hide' : 'View'}
                              </button>
                            </div>

                            {/* Tasks List */}
                            <div className="p-3">
                              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tasks</p>
                              <div className="space-y-1.5">
                                {[...doc.tasks].sort((a, b) => {
                                  // Sort: not-started and in-progress first, completed last
                                  if (a.status === 'completed' && b.status !== 'completed') return 1;
                                  if (a.status !== 'completed' && b.status === 'completed') return -1;
                                  return 0;
                                }).map((task, taskIdx) => {
                                  const getStatusBadge = (status: string) => {
                                    switch (status) {
                                      case 'completed':
                                        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed', icon: '✓' };
                                      case 'in-progress':
                                        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress', icon: '⟳' };
                                      default:
                                        return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Started', icon: '○' };
                                    }
                                  };
                                  const statusBadge = getStatusBadge(task.status);
                                  
                                  return (
                                    <div
                                      key={taskIdx}
                                      onClick={() => handleTaskClick(activity.title, task, activity.selectionId)}
                                      className="flex items-start gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                      {task.status === 'completed' && (
                                        <div className="flex-shrink-0 mt-0.5">
                                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}`}>
                                          {task.title}
                                        </p>
                                        {task.page && (
                                          <p className="text-xs text-gray-500 mt-0.5">Page {task.page}</p>
                                        )}
                                      </div>
                                      <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium ${statusBadge.bg} ${statusBadge.text} rounded-full flex items-center gap-1`}>
                                        <span>{statusBadge.icon}</span>
                                        {statusBadge.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium text-indigo-700">
                                    {doc.tasks.filter(t => t.status === 'completed').length} of {doc.tasks.length}
                                  </span> tasks completed by counselor
                                </p>
                              </div>
                            </div>

                            {/* Document Viewer */}
                            {isViewing && (
                              <div className="border-t border-indigo-100 p-3 bg-gray-50">
                                {isPdf ? (
                                  <iframe
                                    src={`http://localhost:5000${doc.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-96 border-none rounded"
                                    title={`Counselor Document ${docIdx + 1}`}
                                    onContextMenu={(e) => e.preventDefault()}
                                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                                    onLoad={(e) => {
                                      const iframe = e.target as HTMLIFrameElement;
                                      try {
                                        if (iframe.contentDocument) {
                                          iframe.contentDocument.addEventListener('contextmenu', (e) => e.preventDefault());
                                          iframe.contentDocument.body.style.userSelect = 'none';
                                          iframe.contentDocument.body.style.webkitUserSelect = 'none';
                                        }
                                      } catch (err) {
                                        // Cross-origin restriction
                                      }
                                    }}
                                  />
                                ) : isWord ? (
                                  <WordDocViewer url={doc.url} />
                                ) : (
                                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded">
                                    <p className="text-gray-600">Document preview not available</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Proof Upload Section */}
                {activity.proofUploaded ? (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900 mb-2">Proof Uploaded</p>
                    <p className="text-xs text-blue-700 mb-3">
                      Submitted: {new Date(activity.submission!.submittedAt).toLocaleString()}
                    </p>
                    <div className="space-y-4">
                      {activity.submission!.files.map((fileUrl, index) => (
                        <div key={index} className="flex flex-col gap-2">
                          <button
                            onClick={() => setViewingFileUrl(viewingFileUrl === fileUrl ? null : fileUrl)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all w-fit ${viewingFileUrl === fileUrl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {viewingFileUrl === fileUrl ? 'Hide Proof' : `View Proof ${index + 1}`}
                          </button>
                          {viewingFileUrl === fileUrl && (
                            <InlineDocViewer url={fileUrl} onClose={() => setViewingFileUrl(null)} />
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                        input.onchange = (e) => {
                          handleProofUpload(activity.selectionId, e as any);
                        };
                        input.click();
                      }}
                      disabled={uploadingProof === activity.selectionId}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                    >
                      {uploadingProof === activity.selectionId
                        ? 'Uploading...'
                        : 'Replace Proof'}
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Proof (PDF, Images, Word Documents)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleProofUpload(activity.selectionId, e)}
                      disabled={uploadingProof === activity.selectionId}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploadingProof === activity.selectionId && (
                      <p className="text-xs text-gray-500 mt-2">Uploading...</p>
                    )}
                  </div>
                )}

                {/* Evaluation Score */}
                {activity.evaluated && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Score: {activity.evaluation!.score}/10
                    </p>
                    {activity.evaluation!.feedback && (
                      <p className="text-sm text-green-800 whitespace-pre-wrap mt-2">
                        {activity.evaluation!.feedback}
                      </p>
                    )}
                    <p className="text-xs text-green-700 mt-2">
                      Evaluated: {new Date(activity.evaluation!.evaluatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>

      {/* Conversation Window Section */}
      {selectedTask && (
        <div className="w-[65%] border-l border-gray-200 h-screen overflow-hidden">
          <ConversationWindow
            activityTitle={selectedTask.activityTitle}
            task={selectedTask.task}
            activityId={selectedTask.activityId}
            studentIvyServiceId={studentIvyServiceId!}
            onClose={handleCloseConversation}
          />
        </div>
      )}
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <div className="font-sans">
      <Suspense fallback={<div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Activities...</div>}>
        <ActivitiesContent />
      </Suspense>
    </div>
  );
}
