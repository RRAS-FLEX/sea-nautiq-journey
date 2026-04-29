import { Anchor, Wind, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export type BoatCategory = "yacht" | "party" | "watersports";

interface BoatCategorySelectorProps {
  onSelect: (category: BoatCategory) => void;
  onCancel: () => void;
}

export const BoatCategorySelector = ({ onSelect, onCancel }: BoatCategorySelectorProps) => {
  const { tl } = useLanguage();

  const categories = [
    {
      id: "yacht" as const,
      title: tl("Traditional Boats & Yachts", "Παραδοσιακά σκάφη και γιοτ"),
      description: tl(
        "Sailboats, motor yachts, catamarans, or other multi-hour charter experiences",
        "Ιστιοπλοϊκά, μηχανικά γιοτ, καταμαράν ή άλλες εμπειρίες πολλών ωρών",
      ),
      icon: Anchor,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      types: ["Motor Yacht", "Speed Boat", "Catamaran", "Luxury Yacht", "Sailboat", "Dinghy", "Jet Ski"],
    },
    {
      id: "party" as const,
      title: tl("Boat Parties & Group Events", "Κόμα κץ και εκδηλώσεις ομάδας"),
      description: tl(
        "Purpose-built party boats and event venues for groups and celebrations",
        "Σκάφη κόμματος και χώροι εκδηλώσεων για ομάδες και γιορτές",
      ),
      icon: Wind,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      types: ["Party Boat", "Watersports Charter"],
    },
    {
      id: "watersports" as const,
      title: tl("Watersports & Equipment Rentals", "Υδάτινα σπορ και ενοικιάσεις εξοπλισμού"),
      description: tl(
        "Jet skis, paddleboards, kayaks, or other hourly rental equipment",
        "Jet ski, σανίδες paddleboard, καγιάκ ή άλλος εξοπλισμός ενοικίασης",
      ),
      icon: Zap,
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
      types: ["Paddleboard"],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            {tl("What are you listing?", "Τι κατάχωρίζετε;")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {tl(
              "Choose the category that best matches your offering. Each category has a tailored form for your needs.",
              "Επιλέξτε την κατηγορία που ταιριάζει καλύτερα με την προσφορά σας. Κάθε κατηγορία έχει μια προσαρμοσμένη φόρμα.",
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className={`text-left p-4 rounded-lg border-2 transition ${cat.color}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <Icon className="h-5 w-5 mt-0.5" />
                    <h3 className="font-semibold text-sm">{cat.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              {tl("Cancel", "Ακύρωση")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
