import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import { createSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Socket } from "socket.io-client";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtOrder: number;
  product: { name: string };
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  createdAt: string;
  user?: { email: string };
  orderItems: OrderItem[];
}

interface ChatMessage {
  orderId: number;
  message: string;
  senderRole: string;
  timestamp: string;
}

const statuses = ["Pending", "Processing", "OutForDelivery", "Delivered"];
const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  OutForDelivery: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
};

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder({
          ...data,
          totalAmount: Number(data.totalAmount),
          orderItems: data.orderItems.map((item: any) => ({
            ...item,
            priceAtOrder: Number(item.priceAtOrder),
          })),
        });
      } catch {
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

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
    setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
  });

  socket.on('connect', () => {
    socket.emit('joinOrderRoom', { orderId: Number(id) });
  });

  socket.connect();

  return () => {
    socket.disconnect();
  };
}, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStatusChange = async (newStatus: string) => {
    setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const sendMessage = () => {
  if (!messageInput.trim() || !socketRef.current) return;

  socketRef.current.emit('sendChatMessage', {
    orderId: Number(id),
    message: messageInput.trim(),
    senderRole: 'admin',
  });

  setMessageInput('');
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <Select value={order.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${statusColors[s]}`}
                >
                  {s}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.user && (
            <p>
              <span className="font-medium">Customer:</span> {order.user.email}
            </p>
          )}
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
            Chat with Customer
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
                  No messages yet
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-2 flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      msg.senderRole === "admin"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">
                      {msg.senderRole === "admin" ? "You" : "Customer"}
                    </p>
                    <p>{msg.message}</p>
                    <p
                      className={`mt-1 text-xs ${msg.senderRole === "admin" ? "text-blue-100" : "text-gray-500"}`}
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
