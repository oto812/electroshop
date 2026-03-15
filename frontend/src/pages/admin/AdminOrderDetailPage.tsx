import { useEffect, useState, useRef } from "react";
import styled from "styled-components";
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
import {
  NarrowContainer,
  StatusBadge,
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
  &:last-child {
    margin-bottom: 0;
  }
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
`;

const ChatCardHeader = styled(CardHeader)`
  cursor: pointer;
`;

const ChatHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatToggle = styled.span`
  font-size: ${({ theme }) => theme.font.sm};
  font-weight: ${({ theme }) => theme.weight.normal};
  color: ${({ theme }) => theme.color.gray500};
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

const MessageRow = styled.div<{ $isAdmin: boolean }>`
  display: flex;
  justify-content: ${({ $isAdmin }) => ($isAdmin ? "flex-end" : "flex-start")};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const MessageBubble = styled.div<{ $isAdmin: boolean }>`
  max-width: 20rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
  font-size: ${({ theme }) => theme.font.sm};
  background-color: ${({ $isAdmin }) => ($isAdmin ? "#3b82f6" : "#e5e7eb")};
  color: ${({ $isAdmin }) => ($isAdmin ? "#ffffff" : "#1f2937")};
`;

const SenderLabel = styled.p`
  font-size: 0.7rem;
  font-weight: ${({ theme }) => theme.weight.medium};
  margin: 0 0 ${({ theme }) => theme.space[1]};
`;

const MessageTime = styled.p<{ $isAdmin: boolean }>`
  margin: ${({ theme }) => `${theme.space[1]} 0 0`};
  font-size: 0.7rem;
  color: ${({ $isAdmin }) => ($isAdmin ? "rgba(255,255,255,0.7)" : "#6b7280")};
`;

const ChatInputRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
`;

const SpacedCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

const SkeletonWrapper = styled.div`
  padding-top: ${({ theme }) => theme.space[8]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  orderId: number;
  message: string;
  senderRole: string;
  timestamp: string;
}

const statuses = ["Pending", "Processing", "OutForDelivery", "Delivered"];

// ─── Page ─────────────────────────────────────────────────────────────────────

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

    socket.on("chatHistory", (history: ChatMessage[]) => setMessages(history));

    socket.on("chatMessage", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (
          prev.some(
            (m) => m.timestamp === msg.timestamp && m.message === msg.message,
          )
        )
          return prev;
        return [...prev, msg];
      });
    });

    socket.on(
      "orderStatusUpdate",
      (data: { orderId: number; status: string }) => {
        queryClient.setQueryData(queryKeys.order(id), (old: any) =>
          old ? { ...old, status: data.status } : old,
        );
      },
    );

    socket.on("connect", () =>
      socket.emit("joinOrderRoom", { orderId: Number(id) }),
    );
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
      old ? { ...old, status: newStatus } : old,
    );
    try {
      await updateStatus.mutateAsync({ id: Number(id), status: newStatus });
      toast.success(
        t("adminOrderDetail.statusUpdated", {
          status: t(`status.${newStatus}`),
        }),
      );
    } catch {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      toast.error(t("adminOrderDetail.statusError"));
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
      <SkeletonWrapper>
        <SkeletonBox $h="2rem" $w="10rem" />
        <SkeletonBox $h="10rem" />
      </SkeletonWrapper>
    );
  }

  if (!order) {
    return <EmptyState>{t("adminOrderDetail.notFound")}</EmptyState>;
  }

  const hasValidRouteCoordinates =
    order.deliveryLatitude != null &&
    order.deliveryLongitude != null &&
    order.deliveryLatitude !== 0 &&
    order.deliveryLongitude !== 0;

  return (
    <NarrowContainer $maxWidth="48rem">
      <OrderHeading>
        <OrderTitle>
          {t("adminOrderDetail.heading", { id: order.id })}
        </OrderTitle>
        <Select value={order.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                <StatusBadge status={s}>{t(`status.${s}`)}</StatusBadge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OrderHeading>

      <SpacedCard>
        <CardHeader>
          <CardTitle>{t("adminOrderDetail.details")}</CardTitle>
        </CardHeader>
        <CardContent>
          {order.user && (
            <DetailRow>
              <DetailLabel>{t("adminOrderDetail.customerLabel")}</DetailLabel>{" "}
              {order.user.email}
            </DetailRow>
          )}
          <DetailRow>
            <DetailLabel>{t("adminOrderDetail.dateLabel")}</DetailLabel>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </DetailRow>
          <DetailRow>
            <DetailLabel>{t("adminOrderDetail.addressLabel")}</DetailLabel>{" "}
            {order.deliveryAddress}
          </DetailRow>
        </CardContent>
      </SpacedCard>

      {hasValidRouteCoordinates && (
        <SpacedCard>
          <CardHeader>
            <CardTitle>{t("adminOrderDetail.route")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderRouteMap
              deliveryLatitude={order.deliveryLatitude!}
              deliveryLongitude={order.deliveryLongitude!}
              deliveryAddress={order.deliveryAddress}
            />
          </CardContent>
        </SpacedCard>
      )}

      <SpacedCard>
        <CardHeader>
          <CardTitle>{t("adminOrderDetail.items")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHead>
              <tr>
                <Th>{t("adminOrderDetail.product")}</Th>
                <Th>{t("adminOrderDetail.qty")}</Th>
                <ThRight>{t("adminOrderDetail.price")}</ThRight>
                <ThRight>{t("adminOrderDetail.subtotal")}</ThRight>
              </tr>
            </TableHead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={item.id}>
                  <Td>{item.product.name}</Td>
                  <Td>{item.quantity}</Td>
                  <TdRight>${item.priceAtOrder.toFixed(2)}</TdRight>
                  <TdRight>
                    ${(item.priceAtOrder * item.quantity).toFixed(2)}
                  </TdRight>
                </tr>
              ))}
            </tbody>
            <TotalFooter>
              <tr>
                <TotalCellLabel colSpan={3}>
                  {t("adminOrderDetail.total")}
                </TotalCellLabel>
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
              {t("adminOrderDetail.chat")}
              <ChatToggle>
                {chatOpen
                  ? t("adminOrderDetail.collapse")
                  : t("adminOrderDetail.expand")}
              </ChatToggle>
            </ChatHeaderRow>
          </CardTitle>
        </ChatCardHeader>
        {chatOpen && (
          <CardContent>
            <ChatMessages>
              {messages.length === 0 && (
                <EmptyChat>{t("adminOrderDetail.noMessages")}</EmptyChat>
              )}
              {messages.map((msg, i) => (
                <MessageRow key={i} $isAdmin={msg.senderRole === "admin"}>
                  <MessageBubble $isAdmin={msg.senderRole === "admin"}>
                    <SenderLabel>
                      {msg.senderRole === "admin"
                        ? t("adminOrderDetail.you")
                        : t("adminOrderDetail.customer")}
                    </SenderLabel>
                    <p style={{ margin: 0 }}>{msg.message}</p>
                    <MessageTime $isAdmin={msg.senderRole === "admin"}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </MessageTime>
                  </MessageBubble>
                </MessageRow>
              ))}
              <div ref={chatEndRef} />
            </ChatMessages>
            <ChatInputRow>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("adminOrderDetail.messagePlaceholder")}
              />
              <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                {t("adminOrderDetail.send")}
              </Button>
            </ChatInputRow>
          </CardContent>
        )}
      </Card>
    </NarrowContainer>
  );
}
