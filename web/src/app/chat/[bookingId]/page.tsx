'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, MapPin, Calendar, CreditCard } from 'lucide-react';

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
    <div className="flex flex-col h-[calc(100%+3rem)] bg-[#030303] -mx-6 -my-6 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-900/60 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <button 
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-neutral-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div>
          <h2 className="font-bold text-xs text-neutral-100 tracking-tight">Ride Coordination</h2>
          <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-wider">Booking ID: {bookingId.slice(0, 8)}</span>
        </div>
      </div>

      {/* Cash Warning Banner */}
      <div className="bg-amber-500/5 border-b border-amber-500/10 px-5 py-3 flex items-start gap-2.5 text-[10px] text-amber-300 font-medium">
        <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="leading-normal">
          <strong>Payment Policy:</strong> Pay your driver in <strong>cash</strong> inside the car. Do not send online transactions.
        </p>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4.5 pb-24">
        {loading ? (
          <div className="text-center text-xs text-neutral-500 py-8">Loading message history...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId || msg.sender_id === 'me';
            return (
              <div 
                key={msg.id}
                className={`max-w-[80%] flex flex-col gap-1 ${
                  isMe ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <span className="text-[9px] text-neutral-500 font-bold px-1.5">
                  {isMe ? 'You' : msg.sender_name || 'Driver'}
                </span>
                <div 
                  className={`px-4 py-2.5 rounded-[18px] text-[12px] leading-relaxed font-semibold ${
                    isMe 
                      ? 'bg-[var(--color-emerald)] text-white rounded-tr-none shadow-[0_4px_12px_rgba(5,150,105,0.15)]' 
                      : 'bg-[#0f0f12] text-neutral-200 rounded-tl-none border border-neutral-900/60 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[8px] text-neutral-600 px-1.5 font-bold mt-0.5">
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
        className="absolute bottom-0 left-0 right-0 p-4 bg-[#09090b] border-t border-neutral-900/60 flex gap-2 items-center z-20"
      >
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message to coordinate..."
          className="flex-1 bg-[#18181b]/50 border border-neutral-900 rounded-full text-xs text-white px-4 py-2.5 outline-none focus:border-neutral-700 transition-colors"
        />
        <button 
          type="submit"
          className="btn-emerald p-2.5 rounded-full shrink-0 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-white fill-white/10" />
        </button>
      </form>
    </div>
  );
}
