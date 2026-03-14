import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Camera, Mail, Phone, Check, X, Upload } from "lucide-react";

const AVATAR_COLORS = [
  { from: "#C9A96E", to: "#E8C97A" },
  { from: "#8B5CF6", to: "#C084FC" },
  { from: "#EC4899", to: "#F9A8D4" },
  { from: "#10B981", to: "#6EE7B7" },
  { from: "#3B82F6", to: "#93C5FD" },
  { from: "#F97316", to: "#FED7AA" },
];

export function TechProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`;

  const [avatarImg, setAvatarImg] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState(0);
  const [editContact, setEditContact] = useState(false);

  const [savedEmail, setSavedEmail] = useState(user?.email ?? "maya@glamnails.com");
  const [savedPhone, setSavedPhone] = useState("(555) 201-3344");
  const [draftEmail, setDraftEmail] = useState(savedEmail);
  const [draftPhone, setDraftPhone] = useState(savedPhone);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatarImg(ev.target?.result as string);
      toast({ title: "Profile photo updated!" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removePhoto = () => {
    setAvatarImg(null);
    toast({ title: "Profile photo removed" });
  };

  const saveContact = () => {
    if (!draftEmail.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setSavedEmail(draftEmail);
    setSavedPhone(draftPhone);
    setEditContact(false);
    toast({ title: "Contact information saved!" });
  };

  const cancelContact = () => {
    setDraftEmail(savedEmail);
    setDraftPhone(savedPhone);
    setEditContact(false);
  };

  const col = AVATAR_COLORS[avatarColor];

  return (
    <DashboardLayout requiredRole={UserRole.technician}>
      <div className="mb-8">
        <h1 className="text-4xl font-display text-white mb-2">My Profile</h1>
        <p className="text-muted-foreground">Update your photo and contact details</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── Photo card ── */}
        <Card className="glass-panel">
          <CardContent className="p-6">
            <h2 className="text-white font-semibold mb-5">Profile Photo</h2>

            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative shrink-0">
                <div
                  className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-black font-bold text-2xl"
                  style={avatarImg ? {} : { background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}
                >
                  {avatarImg
                    ? <img src={avatarImg} alt="Profile" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg hover:bg-primary/80 transition-colors"
                  title="Upload photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {avatarImg ? "Custom photo active — or pick an avatar color below." : "Upload a photo, or choose an avatar color."}
                  </p>
                  <div className="flex gap-2">
                    {AVATAR_COLORS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setAvatarColor(i); setAvatarImg(null); }}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${avatarColor === i && !avatarImg ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                        title={`Color ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Upload Photo
                  </Button>
                  {avatarImg && (
                    <Button variant="outline" size="sm" className="text-red-400 border-red-400/20 hover:bg-red-400/10" onClick={removePhoto}>
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Contact card ── */}
        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Contact Information</h2>
              {!editContact ? (
                <Button variant="outline" size="sm" onClick={() => setEditContact(true)}>Edit</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={saveContact} title="Save">
                    <Check className="w-4 h-4 text-green-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelContact} title="Cancel">
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </Label>
                {editContact
                  ? <Input
                      type="email"
                      value={draftEmail}
                      onChange={e => setDraftEmail(e.target.value)}
                      placeholder="you@salon.com"
                      autoFocus
                    />
                  : <p className="text-white">{savedEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </Label>
                {editContact
                  ? <Input
                      type="tel"
                      value={draftPhone}
                      onChange={e => setDraftPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                    />
                  : <p className="text-white">{savedPhone || "—"}</p>}
              </div>

              {editContact && (
                <div className="pt-2 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={cancelContact}>Cancel</Button>
                  <Button variant="gold" className="flex-1" onClick={saveContact}>Save Changes</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Read-only info card ── */}
        <Card className="glass-panel">
          <CardContent className="p-6">
            <h2 className="text-white font-semibold mb-5">Account Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Full Name</p>
                <p className="text-white">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Role</p>
                <p className="text-white capitalize">{user?.role?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Station</p>
                <p className="text-white">Station 3</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Commission Rate</p>
                <p className="text-white">42%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">To update your name, station, or commission rate, contact your salon manager.</p>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
