import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOrderDetail, useUpdateOrderStatus, queryKeys } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { createSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import "../../lib/leaflet-setup";
import { OrderRouteMap } from "@/components/admin/OrderRouteMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Socket } from "socket.io-client";

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
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: order, isLoading } = useOrderDetail(id);
  const updateStatus = useUpdateOrderStatus();

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on("chatHistory", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("chatMessage", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.timestamp === msg.timestamp && m.message === msg.message)) {
          return prev;
        }
        return [...prev, msg];
      });
    });

    socket.on("orderStatusUpdate", (data: { orderId: number; status: string }) => {
      queryClient.setQueryData(queryKeys.order(id), (old: any) =>
        old ? { ...old, status: data.status } : old
      );
    });

    socket.on("connect", () => {
      socket.emit("joinOrderRoom", { orderId: Number(id) });
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [id, queryClient]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStatusChange = async (newStatus: string) => {
    queryClient.setQueryData(queryKeys.order(id), (old: any) =>
      old ? { ...old, status: newStatus } : old
    );
    try {
      await updateStatus.mutateAsync({ id: Number(id), status: newStatus });
      toast.success(t('adminOrderDetail.statusUpdated', { status: t(`status.${newStatus}`) }));
    } catch {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      toast.error(t('adminOrderDetail.statusError'));
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit("sendChatMessage", {
      orderId: Number(id),
      message: messageInput.trim(),
      senderRole: "admin",
    });
    setMessageInput("");
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
    return <div className="py-12 text-center text-gray-500">{t('adminOrderDetail.notFound')}</div>;
  }

  const hasValidRouteCoordinates =
    order.deliveryLatitude != null &&
    order.deliveryLongitude != null &&
    order.deliveryLatitude !== 0 &&
    order.deliveryLongitude !== 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('adminOrderDetail.heading', { id: order.id })}</h1>
        <Select value={order.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[s]}`}>
                  {t(`status.${s}`)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('adminOrderDetail.details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.user && (
            <p>
              <span className="font-medium">{t('adminOrderDetail.customerLabel')}</span> {order.user.email}
            </p>
          )}
          <p>
            <span className="font-medium">{t('adminOrderDetail.dateLabel')}</span>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">{t('adminOrderDetail.addressLabel')}</span>{" "}
            {order.deliveryAddress}
          </p>
        </CardContent>
      </Card>

      {hasValidRouteCoordinates && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('adminOrderDetail.route')}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderRouteMap
              deliveryLatitude={order.deliveryLatitude!}
              deliveryLongitude={order.deliveryLongitude!}
              deliveryAddress={order.deliveryAddress}
            />
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('adminOrderDetail.items')}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">{t('adminOrderDetail.product')}</th>
                <th className="pb-2">{t('adminOrderDetail.qty')}</th>
                <th className="pb-2 text-right">{t('adminOrderDetail.price')}</th>
                <th className="pb-2 text-right">{t('adminOrderDetail.subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.product.name}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2 text-right">${item.priceAtOrder.toFixed(2)}</td>
                  <td className="py-2 text-right">${(item.priceAtOrder * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-bold">{t('adminOrderDetail.total')}</td>
                <td className="pt-3 text-right font-bold">${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setChatOpen(!chatOpen)}>
          <CardTitle className="flex items-center justify-between">
            {t('adminOrderDetail.chat')}
            <span className="text-sm font-normal text-gray-500">
              {chatOpen ? t('adminOrderDetail.collapse') : t('adminOrderDetail.expand')}
            </span>
          </CardTitle>
        </CardHeader>
        {chatOpen && (
          <CardContent>
            <div className="mb-4 h-64 overflow-y-auto rounded border bg-gray-50 p-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400">{t('adminOrderDetail.noMessages')}</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`mb-2 flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${msg.senderRole === "admin" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                    <p className="text-xs font-medium mb-1">
                      {msg.senderRole === "admin" ? t('adminOrderDetail.you') : t('adminOrderDetail.customer')}
                    </p>
                    <p>{msg.message}</p>
                    <p className={`mt-1 text-xs ${msg.senderRole === "admin" ? "text-blue-100" : "text-gray-500"}`}>
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
                placeholder={t('adminOrderDetail.messagePlaceholder')}
              />
              <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                {t('adminOrderDetail.send')}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
