import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useOrderDetail } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries";
import { createSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Socket } from "socket.io-client";
import api from "@/lib/axios";

interface ChatMessage {
  orderId: number;
  message: string;
  senderRole: string;
  timestamp: string;
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  OutForDelivery: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useOrderDetail(id);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection + polling fallback
  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('chatHistory', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('chatMessage', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.timestamp === msg.timestamp && m.message === msg.message)) {
          return prev;
        }
        return [...prev, msg];
      });
    });

    socket.on('orderStatusUpdate', (data: { orderId: number; status: string }) => {
      queryClient.setQueryData(queryKeys.order(id), (old: any) =>
        old ? { ...old, status: data.status } : old
      );
      toast.info(`Order status updated to ${data.status}`);
    });

    socket.on('connect', () => {
      socket.emit('joinOrderRoom', { orderId: Number(id) });
    });

    socket.connect();

    const fallbackTimeout = setTimeout(() => {
      if (!socket.connected) {
        pollingRef.current = setInterval(async () => {
          try {
            const { data } = await api.get(`/orders/${id}`);
            queryClient.setQueryData(queryKeys.order(id), (old: any) => {
              if (old && old.status !== data.status) {
                toast.info(`Order status updated to ${data.status}`);
                return { ...old, status: data.status };
              }
              return old;
            });
          } catch {}
        }, 10000);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimeout);
      if (pollingRef.current) clearInterval(pollingRef.current);
      socket.disconnect();
    };
  }, [id, queryClient]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;

    socketRef.current.emit('sendChatMessage', {
      orderId: Number(id),
      message: messageInput.trim(),
      senderRole: 'user',
    });

    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-200" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center text-gray-500">Order not found</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {confirmed && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-center">
          <h2 className="text-xl font-bold text-green-800">
            Thank you for your order!
          </h2>
          <p className="text-green-600">
            Your order has been placed successfully.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Order — {new Date(order.createdAt).toLocaleDateString()}
        </h1>
        <span
          className={`rounded-full px-4 py-1 text-sm font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
        >
          {order.status}
        </span>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="font-medium">Date:</span>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Delivery Address:</span>{" "}
            {order.deliveryAddress}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Product</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.product.name}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2 text-right">
                    ${item.priceAtOrder.toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    ${(item.priceAtOrder * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-bold">
                  Total
                </td>
                <td className="pt-3 text-right font-bold">
                  ${order.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Chat Panel */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <CardTitle className="flex items-center justify-between">
            Chat with Support
            <span className="text-sm font-normal text-gray-500">
              {chatOpen ? "▲ Collapse" : "▼ Expand"}
            </span>
          </CardTitle>
        </CardHeader>
        {chatOpen && (
          <CardContent>
            <div className="mb-4 h-64 overflow-y-auto rounded border bg-gray-50 p-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400">
                  No messages yet. Start a conversation!
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-2 flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      msg.senderRole === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p
                      className={`mt-1 text-xs ${msg.senderRole === "user" ? "text-blue-100" : "text-gray-500"}`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                Send
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
