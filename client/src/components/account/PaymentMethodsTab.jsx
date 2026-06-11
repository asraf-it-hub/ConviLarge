import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

const INITIAL_CARDS = [
  { id: "c1", brand: "Visa", last4: "4242", exp: "12/28", isDefault: true },
  { id: "c2", brand: "Mastercard", last4: "8888", exp: "05/27", isDefault: false }
];

export default function PaymentMethodsTab() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", exp: "", cvc: "", name: "" });

  function handleSetDefault(cardId) {
    setCards((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.id === cardId }))
    );
    toast.success("Default payment method updated!");
  }

  function handleRemove(cardId, brand, last4) {
    if (confirm(`Are you sure you want to remove your ${brand} ending in ${last4}?`)) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      toast.success("Card removed successfully.");
    }
  }

  function handleAddCard(e) {
    e.preventDefault();
    if (newCard.number.length < 16 || newCard.exp.length < 4 || newCard.cvc.length < 3) {
      toast.error("Please fill in card details correctly");
      return;
    }
    const brand = newCard.number.startsWith("5") ? "Mastercard" : "Visa";
    const last4 = newCard.number.slice(-4);
    const createdCard = {
      id: `c-${Date.now()}`,
      brand,
      last4,
      exp: newCard.exp,
      isDefault: cards.length === 0
    };
    setCards((prev) => [...prev, createdCard]);
    setNewCard({ number: "", exp: "", cvc: "", name: "" });
    setShowAdd(false);
    toast.success("Card added successfully!");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Payment Methods</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your saved credit cards for membership upgrades and renewals.</p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} className="self-start text-xs">
            Add New Card
          </Button>
        )}
      </div>

      {showAdd ? (
        <form onSubmit={handleAddCard} className="max-w-md p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Add Credit Card</h3>
          
          <label className="block text-sm font-semibold">
            Cardholder Name
            <input
              type="text"
              required
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={newCard.name}
              onChange={(e) => setNewCard((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Card Number
            <input
              type="text"
              maxLength={16}
              required
              placeholder="0000 0000 0000 0000"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={newCard.number}
              onChange={(e) => setNewCard((prev) => ({ ...prev, number: e.target.value.replace(/\D/g, "") }))}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Expiration Date
              <input
                type="text"
                placeholder="MM/YY"
                maxLength={5}
                required
                className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
                value={newCard.exp}
                onChange={(e) => setNewCard((prev) => ({ ...prev, exp: e.target.value }))}
              />
            </label>

            <label className="block text-sm font-semibold">
              CVC / CVV
              <input
                type="password"
                placeholder="000"
                maxLength={4}
                required
                className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
                value={newCard.cvc}
                onChange={(e) => setNewCard((prev) => ({ ...prev, cvc: e.target.value.replace(/\D/g, "") }))}
              />
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <Button type="submit">Save Card</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 max-w-xl">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between p-4 border rounded-xl bg-white dark:bg-slate-900 ${
                c.isDefault ? "border-slate-300 ring-2 ring-slate-900/5 dark:border-slate-700" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Credit card logo mockup */}
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded font-bold text-xs text-slate-700 dark:text-slate-350">
                  {c.brand}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    •••• •••• •••• {c.last4}
                  </h3>
                  <p className="text-xs text-slate-400">Expires {c.exp}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {c.isDefault ? (
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(c.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleRemove(c.id, c.brand, c.last4)}
                  className="text-xs font-semibold text-red-500 hover:underline p-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No saved payment methods. Click "Add New Card" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
