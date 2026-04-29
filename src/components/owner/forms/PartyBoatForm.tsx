import { useEffect, useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  addOwnerBoat,
  updateOwnerBoat,
  listBoatExtras,
  listBoatPackages,
  saveBoatExtras,
  saveBoatPackages,
  OwnerBoat,
} from "../../../lib/owner-dashboard";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PartyBoatFormProps {
  onClose: () => void;
  boat?: OwnerBoat;
  onSubmit?: () => void;
}

const PARTY_TYPE_OPTIONS = ["Party Boat", "Watersports Charter"];
const PARTY_AMENITIES = [
  "Dance Floor",
  "Sound System",
  "Lighting",
  "Bar Setup",
  "Catering Ready",
  "WiFi",
  "Bathroom",
  "Private Area",
  "Sunbathing Deck",
  "BBQ Area",
];

const createLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `extra-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const PartyBoatForm = ({ onClose, boat, onSubmit }: PartyBoatFormProps) => {
  const { tl } = useLanguage();
  const { toast } = useToast();
  const isEdit = Boolean(boat);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: boat?.name ?? "",
    type: boat?.type ?? "Party Boat",
    location: boat?.location ?? "Thassos",
    description: boat?.description ?? "",
    departureMarina: boat?.departureMarina ?? "",
    capacity: boat?.capacity ?? 20,
    pricePerEvent: boat?.ticketPricePerPerson ?? 120,
    maxEventHours: 8,
    eventSetupTime: 1,
    cancelPolicy: 7,
    mapQuery: boat?.mapQuery ?? "",
    flashSaleEnabled: boat?.flashSaleEnabled ?? false,
    image: boat?.image ?? "",
    status: boat?.status ?? "active",
  });

  const [amenities, setAmenities] = useState<string[]>(boat?.features ?? []);
  const [localImagePreview, setLocalImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extras, setExtras] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [packages, setPackages] = useState<Array<{ id: string; name: string; duration: number; price: number; description: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ticketPricePerPerson = Number(formData.pricePerEvent);
  const eventTotalValue = ticketPricePerPerson * Math.max(1, Number(formData.capacity) || 1);

  useEffect(() => {
    let cancelled = false;

    const loadExtrasAndPackages = async () => {
      if (!boat?.id) {
        setExtras([]);
        setPackages([]);
        return;
      }

      try {
        const [nextExtras, nextPackages] = await Promise.all([
          listBoatExtras(boat.id),
          listBoatPackages(boat.id),
        ]);
        if (!cancelled) {
          setExtras(nextExtras.map((extra) => ({ ...extra, id: extra.id || createLocalId() })));
          setPackages(
            nextPackages.map((pkg) => ({
              ...pkg,
              id: pkg.id || createLocalId(),
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setExtras([]);
          setPackages([]);
        }
      }
    };

    loadExtrasAndPackages();

    return () => {
      cancelled = true;
    };
  }, [boat?.id]);

  const compressImageFile = async (file: File): Promise<File> => {
    try {
      if (typeof window === "undefined" || typeof document === "undefined") return file;
      if (!file.type.startsWith("image/")) return file;
      if (file.size <= 800_000) return file;

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      return await new Promise<File>((resolve) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);

          const maxWidth = 1600;
          const maxHeight = 1600;
          let width = img.width;
          let height = img.height;

          const scale = Math.min(maxWidth / width, maxHeight / height, 1);
          width = Math.round(width * scale);
          height = Math.round(height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              const optimized = new File([blob], file.name, {
                type: blob.type || file.type,
                lastModified: Date.now(),
              });

              resolve(optimized);
            },
            "image/jpeg",
            0.8,
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        };

        img.src = objectUrl;
      });
    } catch {
      return file;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const compressedFile = await compressImageFile(file);
    setImageFile(compressedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(compressedFile);
  };

  const handleSavePartyBoat = async () => {
    if (!formData.name.trim()) {
      toast({
        title: tl("Missing event name", "Λείπει όνομα εκδήλωσης"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const boatInput = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        description: formData.description,
        departureMarina: formData.departureMarina,
        capacity: Number(formData.capacity),
        pricePerDay: Number.isFinite(eventTotalValue) ? Number(eventTotalValue.toFixed(2)) : 0,
        ticketMaxPeople: Number(formData.capacity),
        ticketPricePerPerson: Number.isFinite(ticketPricePerPerson) ? Number(ticketPricePerPerson.toFixed(2)) : 0,
        mapQuery: formData.mapQuery,
        flashSaleEnabled: formData.flashSaleEnabled,
        partyReady: true,
        // voucher fields removed
        features: amenities,
      };

      const boatData = {
        ...boatInput,
        image: formData.image,
        imageFile,
      };

      const savedBoat = isEdit
        ? await updateOwnerBoat(boat!.id, boatData)
        : await addOwnerBoat(boatData);

      if (extras.length > 0) {
        await saveBoatExtras(savedBoat.id, extras);
      }
      if (packages.length > 0) {
        await saveBoatPackages(savedBoat.id, packages);
      }

      toast({
        title: tl(isEdit ? "Party boat updated" : "Party boat added", isEdit ? "Σκάφος πάρτι ενημερώθηκε" : "Σκάφος πάρτι προστέθηκε"),
      });

      onSubmit?.();
      onClose();
    } catch (error) {
      toast({
        title: tl("Error saving party boat", "Σφάλμα κατά την αποθήκευση του σκάφους πάρτι"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{tl("Add Party Boat - Basics", "Προσθήκη Σκάφους Πάρτι - Βασικά")}</span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tl("Event name", "Όνομα εκδήλωσης")}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sunset Party Boat"
                />
              </div>
              <div className="space-y-2">
                <Label>{tl("Type", "Τύπος")}</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTY_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tl("Location", "Τοποθεσία")}</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Thassos"
                />
              </div>
              <div className="space-y-2">
                <Label>{tl("Max guests", "Μέγ. επισκέπτες")}</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{tl("Description", "Περιγραφή")}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your party boat experience..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{tl("Departure location/Marina", "Τοποθεσία αναχώρησης/Μαρίνα")}</Label>
              <Input
                value={formData.departureMarina}
                onChange={(e) => setFormData({ ...formData, departureMarina: e.target.value })}
                placeholder="Marina name"
              />
            </div>

            <div className="space-y-2">
              <Label>{tl("Event image", "Εικόνα εκδήλωσης")}</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-foreground transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {localImagePreview ? (
                    <img src={localImagePreview} alt="Preview" className="h-32 w-32 object-cover rounded mx-auto" />
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">{tl("Click to upload", "Κάντε κλικ για μεταφόρτωση")}</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                {tl("Cancel", "Ακύρωση")}
              </Button>
              <Button onClick={() => setCurrentStep(2)}>{tl("Next", "Επόμενο")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{tl("Add Party Boat - Details", "Προσθήκη Σκάφους Πάρτι - Λεπτομέρειες")}</span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tl("Ticket price per person (€)", "Τιμή εισιτηρίου ανά άτομο (€)")}</Label>
                <Input
                  type="number"
                  value={formData.pricePerEvent}
                  onChange={(e) => setFormData({ ...formData, pricePerEvent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tl("Event total value (€)", "Συνολική αξία εκδήλωσης (€)")}</Label>
                <Input value={eventTotalValue.toFixed(2)} readOnly />
              </div>
              <div className="space-y-2">
                <Label>{tl("Max event duration (hours)", "Μέγ. διάρκεια εκδήλωσης (ώρες)")}</Label>
                <Input
                  type="number"
                  value={formData.maxEventHours}
                  onChange={(e) => setFormData({ ...formData, maxEventHours: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tl("Setup time needed (hours)", "Απαιτούμενος χρόνος ρύθμισης (ώρες)")}</Label>
                <Input
                  type="number"
                  value={formData.eventSetupTime}
                  onChange={(e) => setFormData({ ...formData, eventSetupTime: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tl("Cancellation policy (days)", "Πολιτική ακύρωσης (ημέρες)")}</Label>
                <Input
                  type="number"
                  value={formData.cancelPolicy}
                  onChange={(e) => setFormData({ ...formData, cancelPolicy: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">{tl("Party Amenities", "Ανέσεις Πάρτι")}</h4>
              <div className="grid grid-cols-2 gap-2">
                {PARTY_AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <Checkbox
                      id={`amenity-${amenity}`}
                      checked={amenities.includes(amenity)}
                      onCheckedChange={() => {
                        setAmenities((prev) =>
                          prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
                        );
                      }}
                    />
                    <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Voucher promotion removed */}

            <div className="flex items-center gap-2">
              <Checkbox
                id="flash-sale"
                checked={formData.flashSaleEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, flashSaleEnabled: checked as boolean })}
              />
              <Label htmlFor="flash-sale" className="cursor-pointer">
                {tl("Enable flash sales", "Ενεργοποίηση flash sales")}
              </Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                {tl("Back", "Πίσω")}
              </Button>
              <Button
                onClick={handleSavePartyBoat}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tl("Saving...", "Αποθήκευση...")}
                  </>
                ) : (
                  tl("Save Party Boat", "Αποθήκευση Σκάφους Πάρτι")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
