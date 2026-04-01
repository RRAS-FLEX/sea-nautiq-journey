import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { addOwnerBoat, updateOwnerBoat, listBoatExtras, saveBoatExtras, OwnerBoat, BoatDocument } from "../../lib/owner-dashboard";
import { resolveStorageImage } from "../../lib/storage-public";
import { useToast } from "@/hooks/use-toast";

interface AddBoatModalProps {
  onClose: () => void;
  boat?: OwnerBoat; // if provided â†’ edit mode
}

const BOAT_FEATURE_OPTIONS = [
  "WiFi",
  "Bluetooth Sound",
  "Air Conditioning",
  "Kitchen",
  "WC",
  "Shower",
  "Snorkeling Gear",
  "Fishing Gear",
  "Sun Deck",
  "Skipper Included",
  "Life Jackets",
  "Cooler",
];

const TYPE_PRICE_SUGGESTIONS: Record<string, number> = {
  "Speed Boat": 300,
  Sailboat: 450,
  Catamaran: 700,
  "Motor Yacht": 900,
  "Luxury Yacht": 1500,
};

const DOCUMENT_LABELS = [
  "Registration Certificate",
  "Insurance Policy",
  "Skipper License",
  "Safety Inspection",
  "Port Authority Permit",
];

const BASE_FORM_STEPS = ["Basics", "Details", "Media & Features", "Documents"];
const QUICK_EXTRA_SUGGESTIONS = [
  { name: "Champagne", price: 60 },
  { name: "Fruit platter", price: 35 },
  { name: "Premium snacks", price: 30 },
  { name: "Drone photo package", price: 90 },
  { name: "Paddle board", price: 40 },
];

const createLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `extra-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const AddBoatModal = ({ onClose, boat }: AddBoatModalProps) => {
  const { toast } = useToast();
  const isEdit = Boolean(boat);
  const formSteps = isEdit ? BASE_FORM_STEPS.slice(0, 3) : BASE_FORM_STEPS;
  const docInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: boat?.name ?? "",
    type: boat?.type ?? "Motor Yacht",
    location: boat?.location ?? "Thassos",
    description: boat?.description ?? "",
    lengthMeters: boat?.lengthMeters ?? 8,
    year: boat?.year ?? new Date().getFullYear(),
    cruisingSpeedKnots: boat?.cruisingSpeedKnots ?? 22,
    fuelBurnLitresPerHour: boat?.fuelBurnLitresPerHour ?? 16,
    departureMarina: boat?.departureMarina ?? "",
    cancellationPolicy: Number(boat?.cancellationPolicy) || 72,
    mapQuery: boat?.mapQuery ?? "",
    unavailableDatesInput: (boat?.unavailableDates ?? []).join(", "),
    minNoticeHours: boat?.minNoticeHours ?? 24,
    capacity: boat?.capacity ?? 4,
    pricePerDay: boat?.pricePerDay ?? 500,
    image: boat?.image ?? "",
    skipperRequired: boat?.skipperRequired ?? false,
  });

  const [features, setFeatures] = useState<string[]>(boat?.features ?? ["Life Jackets"]);
  const [localImagePreview, setLocalImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<BoatDocument[]>(boat?.documents ?? []);
  const [extras, setExtras] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [docLabelIndex, setDocLabelIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadExtras = async () => {
      if (!boat?.id) {
        setExtras([]);
        return;
      }

      try {
        const nextExtras = await listBoatExtras(boat.id);
        if (!cancelled) {
          setExtras(nextExtras.map((extra) => ({ ...extra, id: extra.id || createLocalId() })));
        }
      } catch {
        if (!cancelled) {
          setExtras([]);
        }
      }
    };

    loadExtras();

    return () => {
      cancelled = true;
    };
  }, [boat?.id]);

  const addExtraRow = () => {
    setExtras((current) => [...current, { id: createLocalId(), name: "", price: 0 }]);
  };

  const addSuggestedExtra = (name: string, price: number) => {
    setExtras((current) => {
      if (current.some((extra) => extra.name.trim().toLowerCase() === name.trim().toLowerCase())) {
        return current;
      }

      return [...current, { id: createLocalId(), name, price }];
    });
  };

  const removeExtra = (id: string) => {
    setExtras((current) => current.filter((extra) => extra.id !== id));
  };

  const updateExtra = (id: string, key: "name" | "price", value: string | number) => {
    setExtras((current) =>
      current.map((extra) =>
        extra.id === id
          ? {
              ...extra,
              [key]: key === "price" ? Number(value) || 0 : String(value),
            }
          : extra,
      ),
    );
  };

  const handleToggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((item) => item !== feature)
        : [...prev, feature]
    );
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = typeof reader.result === "string" ? reader.result : "";
      setLocalImagePreview(imageData);
      setFormData((prev) => ({ ...prev, image: imageData }));
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        setDocuments((prev) => [
          ...prev,
          {
            name: `${DOCUMENT_LABELS[docLabelIndex] ?? "Document"} - ${file.name}`,
            dataUrl,
            filePath: "",
            fileType: file.type,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // reset input
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const renameDocument = (index: number, name: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, name } : doc))
    );
  };

  const applySuggestedPrice = () => {
    const suggestion = TYPE_PRICE_SUGGESTIONS[formData.type];
    if (suggestion) setFormData((prev) => ({ ...prev, pricePerDay: suggestion }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      return (
        formData.name.trim().length > 0 &&
        formData.type.trim().length > 0 &&
        formData.location.trim().length > 0 &&
        formData.capacity > 0 &&
        formData.pricePerDay > 0 &&
        formData.description.trim().length > 0
      );
    }

    if (step === 2) {
      return (
        formData.lengthMeters > 0 &&
        formData.year > 1900 &&
        formData.cruisingSpeedKnots > 0 &&
        formData.fuelBurnLitresPerHour >= 0 &&
        formData.departureMarina.trim().length > 0 &&
        formData.cancellationPolicy >= 0 &&
        formData.mapQuery.trim().length > 0 &&
        formData.minNoticeHours >= 0
      );
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((step) => Math.min(formSteps.length, step + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    // If user hits Enter or something submits before final step,
    // just treat it as "Next" instead of saving.
    if (currentStep < formSteps.length) {
      if (!validateStep(currentStep)) {
        return;
      }

      setCurrentStep((step) => Math.min(formSteps.length, step + 1));
      return;
    }

    setIsSubmitting(true);
    const unavailableDates = formData.unavailableDatesInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      type: formData.type,
      location: formData.location,
      description: formData.description,
      lengthMeters: formData.lengthMeters,
      year: formData.year,
      cruisingSpeedKnots: formData.cruisingSpeedKnots,
      fuelBurnLitresPerHour: formData.fuelBurnLitresPerHour,
      departureMarina: formData.departureMarina,
      cancellationPolicy: String(formData.cancellationPolicy),
      responseTime: boat?.responseTime ?? "",
      mapQuery: formData.mapQuery,
      unavailableDates,
      minNoticeHours: formData.minNoticeHours,
      capacity: formData.capacity,
      pricePerDay: formData.pricePerDay,
      image: formData.image || "https://via.placeholder.com/400x300?text=Boat",
      imageFile,
      features,
      skipperRequired: formData.skipperRequired,
      documents,
      status: (boat?.status ?? "active") as "active" | "inactive" | "maintenance",
      bookings: boat?.bookings ?? 0,
      rating: boat?.rating ?? 0,
      revenue: boat?.revenue ?? 0,
    };

    try {
      let savedBoatId = boat?.id ?? "";

      if (isEdit && boat) {
        await updateOwnerBoat(boat.id, payload);
        savedBoatId = boat.id;
      } else {
        const createdBoat = await addOwnerBoat(payload);
        savedBoatId = createdBoat.id;
      }

      if (savedBoatId) {
        await saveBoatExtras(
          savedBoatId,
          extras
            .map((extra) => ({
              name: extra.name,
              price: Number(extra.price) || 0,
            }))
            .filter((extra) => extra.name.trim().length > 0),
        );
      }

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save boat";
      const normalized = message.toLowerCase();
      const isMfaPolicyError =
        normalized.includes("boats_mfa_insert_guard") ||
        normalized.includes("boats_mfa_update_guard") ||
        normalized.includes("has_mfa_session_or_service_role") ||
        (normalized.includes("row-level security") && normalized.includes("mfa"));

      toast({
        title: isMfaPolicyError ? "MFA required for owner actions" : "Could not save boat",
        description: isMfaPolicyError
          ? "Your account needs verified MFA to create or edit boats. Enable MFA in Supabase Auth and sign in again."
          : message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedMonthlyRevenue = formData.pricePerDay * 12;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle>{isEdit ? "Edit Boat" : "Add New Boat"}</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" autoCorrect="off" spellCheck={false}>
            <div className="grid grid-cols-4 gap-2">
              {formSteps.map((step, index) => (
                <div key={step} className="space-y-1">
                  <div className={`h-1 rounded-full ${index + 1 <= currentStep ? "bg-aegean" : "bg-muted"}`} />
                  <p className={`text-xs ${index + 1 === currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                    {index + 1}. {step}
                  </p>
                </div>
              ))}
            </div>

            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Boat Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Sunset Sailor" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Boat Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motor Yacht">Motor Yacht</SelectItem>
                      <SelectItem value="Speed Boat">Speed Boat</SelectItem>
                      <SelectItem value="Catamaran">Catamaran</SelectItem>
                      <SelectItem value="Luxury Yacht">Luxury Yacht</SelectItem>
                      <SelectItem value="Sailboat">Sailboat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                    <SelectTrigger id="location"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Thassos">Thassos</SelectItem>
                      <SelectItem value="Halkidiki">Halkidiki</SelectItem>
                      <SelectItem value="Mykonos">Mykonos</SelectItem>
                      <SelectItem value="Santorini">Santorini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Guest Capacity</Label>
                  <Input id="capacity" type="number" min="2" max="20" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 2 })} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price">Price Per Day (€)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={applySuggestedPrice}>Suggest</Button>
                  </div>
                  <Input id="price" type="number" min="100" value={formData.pricePerDay} onChange={(e) => setFormData({ ...formData, pricePerDay: Number(e.target.value) || 100 })} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the boat and guest experience" rows={4} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={formData.skipperRequired} onCheckedChange={(checked) => setFormData({ ...formData, skipperRequired: Boolean(checked) })} />
                    <div>
                      <span className="text-sm font-medium text-foreground">Skipper required</span>
                      <p className="text-xs text-muted-foreground">Enable this if customers must book with a skipper.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lengthMeters">Length (meters)</Label>
                  <Input id="lengthMeters" type="number" min="1" step="0.1" value={formData.lengthMeters} onChange={(e) => setFormData({ ...formData, lengthMeters: Number(e.target.value) || 1 })} disabled={isEdit} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" min="1950" max="2100" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || new Date().getFullYear() })} disabled={isEdit} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cruisingSpeedKnots">Cruising Speed (knots)</Label>
                  <Input id="cruisingSpeedKnots" type="number" min="1" value={formData.cruisingSpeedKnots} onChange={(e) => setFormData({ ...formData, cruisingSpeedKnots: Number(e.target.value) || 1 })} disabled={isEdit} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelBurn">Fuel Burn (litres/hour)</Label>
                  <Input id="fuelBurn" type="number" min="0" value={formData.fuelBurnLitresPerHour} onChange={(e) => setFormData({ ...formData, fuelBurnLitresPerHour: Number(e.target.value) || 0 })} disabled={isEdit} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureMarina">Departure Marina</Label>
                  <Input id="departureMarina" value={formData.departureMarina} onChange={(e) => setFormData({ ...formData, departureMarina: e.target.value })} placeholder="e.g., Limenas Marina" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapQuery">Map Query</Label>
                  <Input id="mapQuery" value={formData.mapQuery} onChange={(e) => setFormData({ ...formData, mapQuery: e.target.value })} placeholder="e.g., Limenas Marina, Thassos, Greece" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                  <Input id="cancellationPolicy" type="number" min="0" value={formData.cancellationPolicy} onChange={(e) => setFormData({ ...formData, cancellationPolicy: Number(e.target.value) || 0 })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minNoticeHours">Minimum Notice (hours)</Label>
                  <Input id="minNoticeHours" type="number" min="0" value={formData.minNoticeHours} onChange={(e) => setFormData({ ...formData, minNoticeHours: Number(e.target.value) || 0 })} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="unavailableDates">Unavailable Dates (comma separated: YYYY-MM-DD)</Label>
                  <Input id="unavailableDates" value={formData.unavailableDatesInput} onChange={(e) => setFormData({ ...formData, unavailableDatesInput: e.target.value })} placeholder="2026-04-01, 2026-04-03" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL (optional)</Label>
                    <Input id="image" type="url" value={formData.image.startsWith("data:") ? "" : formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://example.com/boat.jpg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-file">Upload Image from Computer</Label>
                    <Input id="image-file" type="file" accept="image/*" onChange={handleImageFileChange} />
                  </div>
                </div>

                {(localImagePreview || formData.image) && (
                  <div className="space-y-2">
                    <Label>Image Preview</Label>
                    <img src={localImagePreview || resolveStorageImage(formData.image, "boat-images", formData.image)} alt="Boat preview" className="h-44 w-full rounded-xl object-cover border border-border" />
                  </div>
                )}

                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">Estimated monthly revenue (12 booked days)</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">€{estimatedMonthlyRevenue.toLocaleString()}</p>
                </div>

                <div className="space-y-3">
                  <Label>Boat Features</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BOAT_FEATURE_OPTIONS.map((feature) => (
                      <label key={feature} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                        <Checkbox checked={features.includes(feature)} onCheckedChange={() => handleToggleFeature(feature)} />
                        <span className="text-sm text-foreground">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label>Boat Extras (shown in booking)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addExtraRow}>Add extra</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Add optional paid extras like Champagne, snacks, paddle board, etc.</p>

                  <div className="flex flex-wrap gap-2">
                    {QUICK_EXTRA_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.name}
                        type="button"
                        onClick={() => addSuggestedExtra(suggestion.name, suggestion.price)}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-aegean/40 hover:text-foreground"
                      >
                        + {suggestion.name} (€{suggestion.price})
                      </button>
                    ))}
                  </div>

                  {extras.length > 0 ? (
                    <div className="space-y-2">
                      {extras.map((extra) => (
                        <div key={extra.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2 items-center rounded-lg border border-border p-2.5 bg-background">
                          <Input
                            value={extra.name}
                            placeholder="e.g., Champagne"
                            onChange={(e) => updateExtra(extra.id, "name", e.target.value)}
                          />
                          <Input
                            type="number"
                            min={0}
                            value={extra.price}
                            onChange={(e) => updateExtra(extra.id, "price", e.target.value)}
                            placeholder="Price €"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExtra(extra.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3">No extras yet. Add one to upsell during booking.</p>
                  )}
                </div>
              </div>
            )}

            {!isEdit && currentStep === 4 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-aegean" />
                  <Label>Boat Documents &amp; Papers</Label>
                </div>
                <p className="text-xs text-muted-foreground">Upload registration, insurance, permits, licenses, etc. (PDF or images).</p>

                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_LABELS.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDocLabelIndex(i)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${docLabelIndex === i ? "border-aegean bg-aegean/10 text-foreground" : "border-border text-muted-foreground hover:border-aegean/40"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-aegean/50 transition-colors" onClick={() => docInputRef.current?.click()}>
                  <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload document</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG accepted. Files are stored in Supabase bucket boat-documents.</p>
                </div>
                <input ref={docInputRef} type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={handleDocumentUpload} />

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <FileText className="h-4 w-4 text-aegean shrink-0" />
                        <Input value={doc.name} onChange={(e) => renameDocument(index, e.target.value)} className="flex-1 h-7 text-sm px-2" />
                        {doc.fileType.startsWith("image/") ? (
                          <a href={doc.dataUrl || doc.filePath} target="_blank" rel="noreferrer" className="text-xs text-aegean hover:underline shrink-0">View</a>
                        ) : (
                          <a href={doc.dataUrl || doc.filePath} download={doc.name} className="text-xs text-aegean hover:underline shrink-0">Download</a>
                        )}
                        <button type="button" onClick={() => removeDocument(index)} className="text-destructive hover:opacity-80 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>Back</Button>
              )}
              {currentStep < formSteps.length ? (
                <Button
                  type="button"
                  className="ml-auto bg-gradient-accent text-accent-foreground"
                  onClick={handleNextStep}
                  disabled={isSubmitting || !validateStep(currentStep)}
                >
                  Next Step
                </Button>
              ) : (
                <Button type="submit" className="ml-auto bg-gradient-accent text-accent-foreground" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Boat"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBoatModal;
