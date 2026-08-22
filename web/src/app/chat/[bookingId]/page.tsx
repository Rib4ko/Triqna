'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, MapPin, Calendar, CreditCard } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    booking_id: 'b-101',
    sender_id: 'driver-999',
    content: 'Salam! Thanks for booking. We will meet near the Casa-Port train station main entrance.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    sender_name: 'Youssef El Alami'
  },
  {
    id: 'msg-2',
    booking_id: 'b-101',
    sender_id: 'me',
    content: 'Wa Alaikum Salam Youssef! Perfect, sounds good. I will be carrying a black backpack.',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    sender_name: 'Me'
  },
  {
    id: 'msg-3',
    booking_id: 'b-101',
    sender_id: 'driver-999',
    content: 'Great. Also, just a reminder that the ride is 80 MAD cash. Please try to bring exact change. See you tomorrow!',
    created_at: new Date(Date.now() - 900000).toISOString(),
    sender_name: 'Youssef El Alami'
  }
];

export default function BookingChat() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState('me');
  const [loading, setLoading] = useState(true);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setUserId(userData.user.id);
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        setMessages(MOCK_MESSAGES);
      } else {
        setMessages(data as Message[]);
      }
    } catch (err) {
      setMessages(MOCK_MESSAGES);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates on database table "messages"
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: userId,
          content: messageText
        });

      if (error) {
        // Fallback local append for demo
        appendLocalMessage(messageText);
      }
    } catch (err) {
      appendLocalMessage(messageText);
    }
  };

  const appendLocalMessage = (text: string) => {
    const fallbackMsg: Message = {
      id: `local-${Date.now()}`,
      booking_id: bookingId,
      sender_id: userId,
      content: text,
      created_at: new Date().toISOString(),
      sender_name: 'Me'
    };
    setMessages((prev) => [...prev, fallbackMsg]);
    setTimeout(scrollToBottom, 50);
  };

  return (
    <div className="flex flex-col h-[650px] max-w-3xl mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <button 
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-bold text-xs text-slate-900 tracking-tight">Ride Coordination</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking: #{bookingId.slice(0, 8)}</span>
        </div>
      </div>

      {/* Cash Warning Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start gap-2.5 text-[11px] text-amber-900 font-medium">
        <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong>Payment Policy:</strong> Pay your driver in <strong>cash</strong> inside the car. Do not transfer digital payments online.
        </p>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 pb-20 bg-slate-50/50">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading messages...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId || msg.sender_id === 'me';
            return (
              <div 
                key={msg.id}
                className={`max-w-[80%] sm:max-w-[70%] flex flex-col gap-1 ${
                  isMe ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-semibold px-1">
                  {isMe ? 'You' : msg.sender_name || 'Driver'}
                </span>
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-400 px-1 font-medium mt-0.5">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form 
        onSubmit={handleSendMessage}
        className="absolute bottom-0 left-0 right-0 p-3.5 bg-white border-t border-slate-200 flex gap-2 items-center z-20 shadow-lg"
      >
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message to coordinate..."
          className="flex-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-900 px-4 py-2.5 outline-none focus:bg-white focus:border-blue-600 transition-colors"
        />
        <button 
          type="submit"
          className="btn-primary-blue p-2.5 rounded-full shrink-0 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </form>
    </div>
  );
}
