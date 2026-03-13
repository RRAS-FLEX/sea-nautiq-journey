import { Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getOwnerBoats, deleteOwnerBoat, OwnerBoat } from "../../lib/owner-dashboard";

interface BoatsManagementProps {
  onAddBoat: () => void;
}

const BoatsManagement = ({ onAddBoat }: BoatsManagementProps) => {
  const [boats, setBoats] = useState<OwnerBoat[]>([]);

  useEffect(() => {
    const loadBoats = async () => {
      const nextBoats = await getOwnerBoats();
      setBoats(nextBoats);
    };

    loadBoats();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this boat?")) {
      await deleteOwnerBoat(id);
      setBoats((currentBoats) => currentBoats.filter((boat) => boat.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Your Boats</CardTitle>
            <Button onClick={onAddBoat} className="bg-gradient-accent text-accent-foreground">
              Add Boat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {boats.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {boats.map((boat) => (
                <div
                  key={boat.id}
                  className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <img
                          src={boat.image}
                          alt={boat.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{boat.name}</p>
                        <p className="text-sm text-muted-foreground">{boat.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {boat.location} • {boat.capacity} guests
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {boat.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {feature}
                        </Badge>
                      ))}
                      {boat.features.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{boat.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">€{boat.pricePerDay}/day</p>
                      <Badge className={boat.status === "active" ? "bg-emerald-500 mt-1" : "bg-slate-400 mt-1"}>
                        {boat.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(boat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No boats added yet. Start by adding your first boat!</p>
              <Button onClick={onAddBoat} className="bg-gradient-accent text-accent-foreground">
                Add Boat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {boats.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Boat Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Active Boats</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {boats.filter((b) => b.status === "active").length}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {boats.reduce((sum, b) => sum + b.bookings, 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  €{boats.reduce((sum, b) => sum + b.revenue, 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {boats.length > 0 ? (boats.reduce((sum, b) => sum + b.rating, 0) / boats.length).toFixed(1) : "0.0"}★
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BoatsManagement;
