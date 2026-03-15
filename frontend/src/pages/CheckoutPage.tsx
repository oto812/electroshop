import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "@/context/CartContext";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NarrowContainer, EmptyState } from "@/styles/shared";
import { toast } from "sonner";

// ─── Styled components ────────────────────────────────────────────────────────

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.font["2xl"]};
  font-weight: ${({ theme }) => theme.weight.bold};
  margin: 0 0 ${({ theme }) => theme.space[6]};
`;

const SummaryCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.font.sm};
`;

const SummaryDivider = styled.div`
  border-top: 1px solid var(--border);
  padding-top: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[3]};
`;

const SummaryTotal = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.font.lg};
  font-weight: ${({ theme }) => theme.weight.bold};
`;

const AddressWrapper = styled.div`
  position: relative;
`;

const StyledAddressInput = styled.input`
  display: flex;
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid var(--input);
  background-color: var(--background);
  padding: 0.5rem 0.75rem;
  font-size: ${({ theme }) => theme.font.sm};
  color: var(--foreground);
  outline: none;

  &::placeholder {
    color: var(--muted-foreground);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--ring);
  }
`;

const SuggestionsDropdown = styled.div`
  position: absolute;
  z-index: 50;
  margin-top: ${({ theme }) => theme.space[1]};
  max-height: 16rem;
  width: 100%;
  overflow-y: auto;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid var(--border);
  background-color: ${({ theme }) => theme.color.white};
  box-shadow: ${({ theme }) => theme.shadow.lg};
`;

const SuggestionItem = styled.button`
  display: block;
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--border);
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
  text-align: left;
  font-size: ${({ theme }) => theme.font.sm};
  background: none;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f9fafb;
  }
`;

const SpinnerIcon = styled.svg`
  height: 1rem;
  width: 1rem;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

const LoadingRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = address.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const encodedQuery = encodeURIComponent(trimmed);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodedQuery}&countrycodes=ge`,
          { headers: { "Accept-Language": "en" } },
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data: NominatimSuggestion[] = await response.json();
        setSuggestions(data);
        setDropdownOpen(data.length > 0);
      } catch {
        setSuggestions([]);
        setDropdownOpen(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address]);

  const handleSuggestionClick = (s: NominatimSuggestion) => {
    setAddress(s.display_name);
    setSuggestions([]);
    setDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (address.length < 10) {
      toast.error(t("checkout.addressError"));
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const { data } = await api.post("/orders", { deliveryAddress: address });
      clearCart();
      toast.success(t("checkout.success"));
      navigate(`/orders/${data.id}?confirmed=true`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("checkout.error"));
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <EmptyState>
        {t("checkout.cartEmpty")}
        <Button onClick={() => navigate("/")}>{t("checkout.continueShopping")}</Button>
      </EmptyState>
    );
  }

  return (
    <NarrowContainer $maxWidth="42rem">
      <PageTitle>{t("checkout.title")}</PageTitle>

      <SummaryCard>
        <CardHeader>
          <CardTitle>{t("checkout.orderSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {cartItems.map((item) => (
              <SummaryItem key={item.productId}>
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </SummaryItem>
            ))}
            <SummaryDivider>
              <SummaryTotal>
                <span>{t("checkout.total")}</span>
                <span>${total.toFixed(2)}</span>
              </SummaryTotal>
            </SummaryDivider>
          </div>
        </CardContent>
      </SummaryCard>

      <Card>
        <CardHeader>
          <CardTitle>{t("checkout.deliveryDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div ref={dropdownRef} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Label htmlFor="address">{t("checkout.addressLabel")}</Label>
              <AddressWrapper>
                <StyledAddressInput
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") setDropdownOpen(false); }}
                  onFocus={() => { if (suggestions.length > 0) setDropdownOpen(true); }}
                  placeholder={t("checkout.addressPlaceholder")}
                  required
                  minLength={10}
                  autoComplete="off"
                />
                {dropdownOpen && suggestions.length > 0 && (
                  <SuggestionsDropdown>
                    {suggestions.map((s) => (
                      <SuggestionItem key={s.place_id} type="button" onClick={() => handleSuggestionClick(s)}>
                        {s.display_name}
                      </SuggestionItem>
                    ))}
                  </SuggestionsDropdown>
                )}
              </AddressWrapper>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <LoadingRow>
                  <SpinnerIcon viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </SpinnerIcon>
                  {t("checkout.processing")}
                </LoadingRow>
              ) : (
                t("checkout.payNow", { amount: total.toFixed(2) })
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </NarrowContainer>
  );
}
