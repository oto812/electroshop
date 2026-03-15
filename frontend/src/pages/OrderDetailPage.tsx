import { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOrderDetail, queryKeys } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { createSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NarrowContainer,
  StatusBadge,
  ConfirmationBanner,
  ConfirmationTitle,
  ConfirmationText,
  DataTable,
  TableHead,
  Th,
  ThRight,
  Td,
  TdRight,
  SkeletonBox,
  EmptyState,
} from "@/styles/shared";
import { toast } from "sonner";
import { Socket } from "socket.io-client";
import api from "@/lib/axios";

// ─── Styled components ────────────────────────────────────────────────────────

const OrderHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

const OrderTitle = styled.h1`
  font-size: ${({ theme }) => theme.font["2xl"]};
  font-weight: ${({ theme }) => theme.weight.bold};
  margin: 0;
`;

const DetailRow = styled.p`
  margin: 0 0 ${({ theme }) => theme.space[2]};

  &:last-child { margin-bottom: 0; }
`;

const DetailLabel = styled.span`
  font-weight: ${({ theme }) => theme.weight.medium};
`;

const TotalFooter = styled.tfoot``;

const TotalCell = styled.td`
  padding-top: ${({ theme }) => theme.space[3]};
  font-weight: ${({ theme }) => theme.weight.bold};
  text-align: right;
`;

const TotalCellLabel = styled.td`
  padding-top: ${({ theme }) => theme.space[3]};
  font-weight: ${({ theme }) => theme.weight.bold};
  text-align: right;
  padding-right: 0;
`;

const ChatCardHeader = styled(CardHeader)`
  cursor: pointer;
`;

const ChatToggle = styled.span`
  font-size: ${({ theme }) => theme.font.sm};
  font-weight: ${({ theme }) => theme.weight.normal};
  color: ${({ theme }) => theme.color.gray500};
`;

const ChatHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatMessages = styled.div`
  height: 16rem;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: #f9fafb;
  padding: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const EmptyChat = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.font.sm};
  color: ${({ theme }) => theme.color.gray500};
`;

const MessageRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 20rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
  font-size: ${({ theme }) => theme.font.sm};
  background-color: ${({ $isUser }) => ($isUser ? "#3b82f6" : "#e5e7eb")};
  color: ${({ $isUser }) => ($isUser ? "#ffffff" : "#1f2937")};
`;

const MessageTime = styled.p<{ $isUser: boolean }>`
  margin: ${({ theme }) => `${theme.space[1]} 0 0`};
  font-size: 0.7rem;
  color: ${({ $isUser }) => ($isUser ? "rgba(255,255,255,0.7)" : "#6b7280")};
`;

const ChatInputRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
`;

const SpacedCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  orderId: number;
  message: string;
  senderRole: string;
  timestamp: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: order, isLoading } = useOrderDetail(id);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on("chatHistory", (history: ChatMessage[]) => setMessages(history));

    socket.on("chatMessage", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.timestamp === msg.timestamp && m.message === msg.message)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("orderStatusUpdate", (data: { orderId: number; status: string }) => {
      queryClient.setQueryData(queryKeys.order(id), (old: any) =>
        old ? { ...old, status: data.status } : old
      );
      toast.info(t("orderDetail.statusUpdated", { status: data.status }));
    });

    socket.on("connect", () => socket.emit("joinOrderRoom", { orderId: Number(id) }));
    socket.connect();

    const fallbackTimeout = setTimeout(() => {
      if (!socket.connected) {
        pollingRef.current = setInterval(async () => {
          try {
            const { data } = await api.get(`/orders/${id}`);
            queryClient.setQueryData(queryKeys.order(id), (old: any) => {
              if (old && old.status !== data.status) {
                toast.info(t("orderDetail.statusUpdated", { status: data.status }));
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
  }, [id, queryClient, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit("sendChatMessage", { orderId: Number(id), message: messageInput.trim(), senderRole: "user" });
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (isLoading) {
    return (
      <NarrowContainer $maxWidth="48rem" style={{ paddingTop: "2rem" }}>
        <SkeletonBox $h="2rem" $w="12rem" style={{ marginBottom: "1rem" }} />
        <SkeletonBox $h="10rem" />
      </NarrowContainer>
    );
  }

  if (!order) {
    return <EmptyState>{t("orderDetail.notFound")}</EmptyState>;
  }

  return (
    <NarrowContainer $maxWidth="48rem">
      {confirmed && (
        <ConfirmationBanner>
          <ConfirmationTitle>{t("orderDetail.confirmed")}</ConfirmationTitle>
          <ConfirmationText>{t("orderDetail.confirmedDesc")}</ConfirmationText>
        </ConfirmationBanner>
      )}

      <OrderHeading>
        <OrderTitle>
          {t("orderDetail.heading", { date: new Date(order.createdAt).toLocaleDateString() })}
        </OrderTitle>
        <StatusBadge status={order.status}>
          {t(`status.${order.status}`, order.status)}
        </StatusBadge>
      </OrderHeading>

      <SpacedCard>
        <CardHeader><CardTitle>{t("orderDetail.details")}</CardTitle></CardHeader>
        <CardContent>
          <DetailRow>
            <DetailLabel>{t("orderDetail.dateLabel")}</DetailLabel>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </DetailRow>
          <DetailRow>
            <DetailLabel>{t("orderDetail.addressLabel")}</DetailLabel>{" "}
            {order.deliveryAddress}
          </DetailRow>
        </CardContent>
      </SpacedCard>

      <SpacedCard>
        <CardHeader><CardTitle>{t("orderDetail.items")}</CardTitle></CardHeader>
        <CardContent>
          <DataTable>
            <TableHead>
              <tr>
                <Th>{t("orderDetail.product")}</Th>
                <Th>{t("orderDetail.qty")}</Th>
                <ThRight>{t("orderDetail.price")}</ThRight>
                <ThRight>{t("orderDetail.subtotal")}</ThRight>
              </tr>
            </TableHead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id}>
                  <Td>{item.product.name}</Td>
                  <Td>{item.quantity}</Td>
                  <TdRight>${item.priceAtOrder.toFixed(2)}</TdRight>
                  <TdRight>${(item.priceAtOrder * item.quantity).toFixed(2)}</TdRight>
                </tr>
              ))}
            </tbody>
            <TotalFooter>
              <tr>
                <TotalCellLabel colSpan={3}>{t("orderDetail.total")}</TotalCellLabel>
                <TotalCell>${order.totalAmount.toFixed(2)}</TotalCell>
              </tr>
            </TotalFooter>
          </DataTable>
        </CardContent>
      </SpacedCard>

      <Card>
        <ChatCardHeader onClick={() => setChatOpen(!chatOpen)}>
          <CardTitle>
            <ChatHeaderRow>
              {t("orderDetail.chat")}
              <ChatToggle>{chatOpen ? t("orderDetail.collapse") : t("orderDetail.expand")}</ChatToggle>
            </ChatHeaderRow>
          </CardTitle>
        </ChatCardHeader>
        {chatOpen && (
          <CardContent>
            <ChatMessages>
              {messages.length === 0 && <EmptyChat>{t("orderDetail.noMessages")}</EmptyChat>}
              {messages.map((msg, i) => (
                <MessageRow key={i} $isUser={msg.senderRole === "user"}>
                  <MessageBubble $isUser={msg.senderRole === "user"}>
                    <p style={{ margin: 0 }}>{msg.message}</p>
                    <MessageTime $isUser={msg.senderRole === "user"}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </MessageTime>
                  </MessageBubble>
                </MessageRow>
              ))}
              <div ref={chatEndRef} />
            </ChatMessages>
            <ChatInputRow>
              <Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("orderDetail.messagePlaceholder")} />
              <Button onClick={sendMessage} disabled={!messageInput.trim()}>{t("orderDetail.send")}</Button>
            </ChatInputRow>
          </CardContent>
        )}
      </Card>
    </NarrowContainer>
  );
}
