import { useState } from "react";
import { OwnerBoat } from "../../lib/owner-dashboard";
import { BoatCategorySelector, BoatCategory } from "./BoatCategorySelector";
import { YachtForm } from "./forms/YachtForm";
import { PartyBoatForm } from "./forms/PartyBoatForm";
import { WatersportsForm } from "./forms/WatersportsForm";

interface AddBoatModalProps {
  onClose: () => void;
  boat?: OwnerBoat; // if provided → edit mode
}

// Determine category from existing boat type
const getCategoryFromBoat = (boat?: OwnerBoat): BoatCategory | null => {
  if (!boat) return null;

  const partyTypes = ["Party Boat", "Watersports Charter"];
  const watersportsTypes = ["Paddleboard", "Kayak", "Windsurfing", "Sailboard", "Surfboard"];
  const yachtTypes = ["Jet Ski", "Motor Yacht", "Speed Boat", "Catamaran", "Luxury Yacht", "Sailboat", "Dinghy"];

  if (partyTypes.includes(boat.type)) return "party";
  if (yachtTypes.includes(boat.type)) return "yacht";
  if (watersportsTypes.includes(boat.type)) return "watersports";
  return "yacht";
};

const AddBoatModal = ({ onClose, boat }: AddBoatModalProps) => {
  // If editing, go straight to the appropriate form. If new, show category selector.
  const [selectedCategory, setSelectedCategory] = useState<BoatCategory | null>(getCategoryFromBoat(boat));

  if (!selectedCategory) {
    return <BoatCategorySelector onSelect={setSelectedCategory} onCancel={onClose} />;
  }

  if (selectedCategory === "yacht") {
    return <YachtForm onClose={onClose} boat={boat} onSubmit={() => setSelectedCategory(null)} />;
  }

  if (selectedCategory === "party") {
    return <PartyBoatForm onClose={onClose} boat={boat} onSubmit={() => setSelectedCategory(null)} />;
  }

  if (selectedCategory === "watersports") {
    return <WatersportsForm onClose={onClose} boat={boat} onSubmit={() => setSelectedCategory(null)} />;
  }

  return null;
};

export default AddBoatModal;
