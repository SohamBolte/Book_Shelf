
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useBookExchange } from "../context/BookExchangeContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageCircle, Send, ArrowLeft, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Messages = () => {
  const { currentUser, getMessagesForUser, markMessageAsRead, sendMessage } = useBookExchange();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  // Get all messages and group them by conversation partner
  const allMessages = getMessagesForUser();
  
  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (!selectedConversation) return;
    
    allMessages
      .filter(msg => 
        (msg.senderId === selectedConversation || msg.receiverId === selectedConversation) && 
        msg.receiverId === currentUser?.id && 
        !msg.isRead
      )
      .forEach(msg => markMessageAsRead(msg.id));
  }, [selectedConversation, allMessages, currentUser]);

  // Group messages by conversation partner
  const conversationPartners = React.useMemo(() => {
    if (!currentUser) return [];
    
    const partnersMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      bookId: string;
      bookTitle: string;
      lastMessage: string;
      lastMessageDate: string;
      unreadCount: number;
      isRequest: boolean;
    }>();
    
    allMessages.forEach(msg => {
      const isIncoming = msg.receiverId === currentUser.id;
      const partnerId = isIncoming ? msg.senderId : msg.receiverId;
      
      if (!partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, {
          partnerId,
          partnerName: isIncoming ? msg.senderName : "Unknown",
          bookId: msg.bookId,
          bookTitle: msg.bookTitle,
          lastMessage: msg.content,
          lastMessageDate: msg.createdAt,
          unreadCount: isIncoming && !msg.isRead ? 1 : 0,
          isRequest: msg.isRequest
        });
      } else {
        const existing = partnersMap.get(partnerId)!;
        if (new Date(msg.createdAt) > new Date(existing.lastMessageDate)) {
          existing.lastMessage = msg.content;
          existing.lastMessageDate = msg.createdAt;
        }
        if (isIncoming && !msg.isRead) {
          existing.unreadCount += 1;
        }
        partnersMap.set(partnerId, existing);
      }
    });
    
    return Array.from(partnersMap.values()).sort((a, b) => 
      new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  }, [allMessages, currentUser]);

  // Get messages for the selected conversation
  const conversationMessages = React.useMemo(() => {
    if (!selectedConversation || !currentUser) return [];
    
    return allMessages
      .filter(msg => 
        msg.senderId === selectedConversation || msg.receiverId === selectedConversation
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [selectedConversation, allMessages, currentUser]);

  const handleSendReply = () => {
    if (!selectedConversation || !currentUser || !replyText.trim()) return;
    
    // Get book ID from the first message in conversation
    const firstMessage = conversationMessages[0];
    if (!firstMessage) return;
    
    sendMessage(selectedConversation, firstMessage.bookId, replyText, false);
    setReplyText("");
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <Layout>
      <div className="page-container max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-book-charcoal">Messages</h1>
        
        {allMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-book-brown opacity-30" />
            <h2 className="text-xl font-semibold mb-2">No Messages Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start browsing books and message owners to begin conversations
            </p>
            <Button 
              onClick={() => navigate("/browse")}
              className="bg-book-brown hover:bg-book-brown/90"
            >
              Browse Books
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Conversation List */}
            <div className={`md:col-span-2 ${selectedConversation ? 'hidden md:block' : ''}`}>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Conversations</h2>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {conversationPartners.map(partner => (
                    <div 
                      key={partner.partnerId}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedConversation === partner.partnerId ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => setSelectedConversation(partner.partnerId)}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{partner.partnerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(partner.lastMessageDate), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm mb-1 truncate">
                        <span className="text-muted-foreground">
                          Re: {partner.bookTitle}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm truncate text-muted-foreground">
                          {partner.lastMessage}
                        </p>
                        {partner.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 bg-book-brown">
                            {partner.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className={`md:col-span-3 ${!selectedConversation ? 'hidden md:block' : ''}`}>
              {selectedConversation ? (
                <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
                  <div className="p-4 border-b flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="md:hidden mr-2"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h2 className="font-semibold">
                        {conversationPartners.find(p => p.partnerId === selectedConversation)?.partnerName}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        About: {conversationPartners.find(p => p.partnerId === selectedConversation)?.bookTitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto p-4">
                    {conversationMessages.map(message => {
                      const isCurrentUser = message.senderId === currentUser.id;
                      
                      return (
                        <div 
                          key={message.id} 
                          className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isCurrentUser 
                                ? 'bg-book-brown text-white rounded-tr-none' 
                                : 'bg-gray-100 rounded-tl-none'
                            }`}
                          >
                            {message.isRequest && !isCurrentUser && (
                              <div className="mb-1">
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  Book Request
                                </Badge>
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <div className="mt-1 text-xs opacity-70 flex justify-between">
                              <span>
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                              {isCurrentUser && (
                                <span>{message.isRead ? 'Read' : 'Sent'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="resize-none"
                      />
                      <Button 
                        className="bg-book-brown hover:bg-book-brown/90"
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow h-full flex flex-col justify-center items-center">
                  <MessageCircle className="h-12 w-12 mb-4 text-book-brown opacity-30" />
                  <h2 className="text-xl font-semibold mb-2">Select a Conversation</h2>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Messages;
