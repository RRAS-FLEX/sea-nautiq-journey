import { useEffect, useState } from "react";
import { Package as PackageIcon, Edit2, Trash2, Plus, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { getOwnerPackages, deleteOwnerPackage, getOwnerBoats, addOwnerPackage, updateOwnerPackage, OwnerBoat, OwnerPackage } from "../../lib/owner-dashboard";

const PackageManagement = () => {
  const [packages, setPackages] = useState<OwnerPackage[]>([]);
  const [boats, setBoats] = useState<OwnerBoat[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: 3,
    price: 150,
    description: "",
    boatIds: [] as string[],
  });

  useEffect(() => {
    const loadData = async () => {
      const [nextPackages, nextBoats] = await Promise.all([getOwnerPackages(), getOwnerBoats()]);
      setPackages(nextPackages);
      setBoats(nextBoats);
    };

    loadData();
  }, []);

  const handleOpenForm = (pkg?: any) => {
    if (pkg) {
      setFormData(pkg);
      setEditingId(pkg.id);
    } else {
      setFormData({
        name: "",
        duration: 3,
        price: 150,
        description: "",
        boatIds: [],
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (!editingId) {
      const createdPackage = await addOwnerPackage({
        name: formData.name,
        duration: formData.duration,
        price: formData.price,
        description: formData.description,
        boatIds: formData.boatIds,
      });
      setPackages((currentPackages) => [createdPackage, ...currentPackages]);
    } else {
      const updatedPackage = await updateOwnerPackage(editingId, {
        name: formData.name,
        duration: formData.duration,
        price: formData.price,
        description: formData.description,
        boatIds: formData.boatIds,
      });

      if (updatedPackage) {
        setPackages((currentPackages) =>
          currentPackages.map((pkg) => (pkg.id === editingId ? updatedPackage : pkg)),
        );
      }
    }

    setShowForm(false);
    setFormData({
      name: "",
      duration: 3,
      price: 150,
      description: "",
      boatIds: [],
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this package?")) {
      await deleteOwnerPackage(id);
      setPackages((currentPackages) => currentPackages.filter((pkg) => pkg.id !== id));
    }
  };

  const toggleBoat = (boatId: string) => {
    setFormData({
      ...formData,
      boatIds: formData.boatIds.includes(boatId)
        ? formData.boatIds.filter((id) => id !== boatId)
        : [...formData.boatIds, boatId],
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5 text-aegean" />
              Trip Packages
            </CardTitle>
            <Button
              onClick={() => handleOpenForm()}
              className="bg-gradient-accent text-accent-foreground gap-2"
            >
              <Plus className="h-4 w-4" />
              New Package
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl border border-border p-4 space-y-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-foreground">
                  {editingId ? "Edit Package" : "Create New Package"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Half-Day Adventure"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the package"
                />
              </div>

              {boats.length > 0 && (
                <div className="space-y-2">
                  <Label>Available for Boats</Label>
                  <div className="space-y-2">
                    {boats.map((boat) => (
                      <div key={boat.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`boat-${boat.id}`}
                          checked={formData.boatIds.includes(boat.id)}
                          onCheckedChange={() => toggleBoat(boat.id)}
                        />
                        <label
                          htmlFor={`boat-${boat.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {boat.name} ({boat.location})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-gradient-accent text-accent-foreground">
                  {editingId ? "Update" : "Create"} Package
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {packages.length > 0 ? (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{pkg.duration}h</Badge>
                      <Badge className="bg-emerald-500">€{pkg.price}</Badge>
                      {pkg.boatIds.length > 0 && (
                        <Badge variant="outline">{pkg.boatIds.length} boat{pkg.boatIds.length !== 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenForm(pkg)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(pkg.id)}
                      className="gap-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No packages created yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <p className="text-sm text-green-900">
            <strong>📦 Package Tips:</strong> Create predefined packages (3-hour, half-day, full-day) to make
            booking easier for customers. Assign them to specific boats or leave open for all.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageManagement;
