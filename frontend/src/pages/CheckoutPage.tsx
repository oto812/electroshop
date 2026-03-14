import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "@/context/CartContext";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

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

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
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

        if (!response.ok) throw new Error("Failed to fetch address suggestions");

        const data: NominatimSuggestion[] = await response.json();
        setSuggestions(data);
        setDropdownOpen(data.length > 0);
      } catch {
        setSuggestions([]);
        setDropdownOpen(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address]);

  const handleSuggestionClick = (suggestion: NominatimSuggestion) => {
    setAddress(suggestion.display_name);
    setSuggestions([]);
    setDropdownOpen(false);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setDropdownOpen(false);
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
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-lg text-gray-500">{t("checkout.cartEmpty")}</p>
        <Button onClick={() => navigate("/")}>{t("checkout.continueShopping")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">{t("checkout.title")}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("checkout.orderSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>{t("checkout.total")}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("checkout.deliveryDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div ref={dropdownRef} className="space-y-2">
              <Label htmlFor="address">{t("checkout.addressLabel")}</Label>
              <div className="relative">
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={handleAddressKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setDropdownOpen(true); }}
                  placeholder={t("checkout.addressPlaceholder")}
                  required
                  minLength={10}
                  autoComplete="off"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {dropdownOpen && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-gray-50 last:border-b-0"
                      >
                        {suggestion.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t("checkout.processing")}
                </span>
              ) : (
                t("checkout.payNow", { amount: total.toFixed(2) })
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
