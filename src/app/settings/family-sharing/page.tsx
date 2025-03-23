"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  UserCog,
  Mail
} from "lucide-react";

// Types for family sharing
type PermissionLevel = "owner" | "admin" | "viewer" | "custom";
type PermissionArea = "transactions" | "budgets" | "bills" | "goals" | "reports" | "settings" | "bankAccounts";

interface Permission {
  area: PermissionArea;
  canView: boolean;
  canEdit: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  permissionLevel: PermissionLevel;
  permissions: Permission[];
  status: "active" | "pending" | "inactive";
  invitedOn: string;
  lastActive?: string;
}

export default function FamilySharingPage() {
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissionLevel, setInvitePermissionLevel] = useState<PermissionLevel>("viewer");
  const [customPermissions, setCustomPermissions] = useState<Record<PermissionArea, { view: boolean, edit: boolean }>>({
    transactions: { view: true, edit: false },
    budgets: { view: true, edit: false },
    bills: { view: true, edit: false },
    goals: { view: true, edit: false },
    reports: { view: true, edit: false },
    settings: { view: false, edit: false },
    bankAccounts: { view: true, edit: false }
  });

  // Sample family members
  const familyMembers: FamilyMember[] = [
    {
      id: "1",
      name: "Jane Doe (You)",
      email: "jane.doe@example.com",
      permissionLevel: "owner",
      permissions: [
        { area: "transactions", canView: true, canEdit: true },
        { area: "budgets", canView: true, canEdit: true },
        { area: "bills", canView: true, canEdit: true },
        { area: "goals", canView: true, canEdit: true },
        { area: "reports", canView: true, canEdit: true },
        { area: "settings", canView: true, canEdit: true },
        { area: "bankAccounts", canView: true, canEdit: true },
      ],
      status: "active",
      invitedOn: "2025-01-01",
      lastActive: "2025-03-23"
    },
    {
      id: "2",
      name: "John Doe",
      email: "john.doe@example.com",
      permissionLevel: "admin",
      permissions: [
        { area: "transactions", canView: true, canEdit: true },
        { area: "budgets", canView: true, canEdit: true },
        { area: "bills", canView: true, canEdit: true },
        { area: "goals", canView: true, canEdit: true },
        { area: "reports", canView: true, canEdit: true },
        { area: "settings", canView: true, canEdit: false },
        { area: "bankAccounts", canView: true, canEdit: true },
      ],
      status: "active",
      invitedOn: "2025-01-02",
      lastActive: "2025-03-22"
    },
    {
      id: "3",
      name: "Sarah Smith",
      email: "sarah.smith@example.com",
      permissionLevel: "viewer",
      permissions: [
        { area: "transactions", canView: true, canEdit: false },
        { area: "budgets", canView: true, canEdit: false },
        { area: "bills", canView: true, canEdit: false },
        { area: "goals", canView: true, canEdit: false },
        { area: "reports", canView: true, canEdit: false },
        { area: "settings", canView: false, canEdit: false },
        { area: "bankAccounts", canView: true, canEdit: false },
      ],
      status: "active",
      invitedOn: "2025-02-15",
      lastActive: "2025-03-20"
    },
    {
      id: "4",
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      permissionLevel: "custom",
      permissions: [
        { area: "transactions", canView: true, canEdit: false },
        { area: "budgets", canView: true, canEdit: true },
        { area: "bills", canView: true, canEdit: true },
        { area: "goals", canView: true, canEdit: false },
        { area: "reports", canView: true, canEdit: false },
        { area: "settings", canView: false, canEdit: false },
        { area: "bankAccounts", canView: false, canEdit: false },
      ],
      status: "active",
      invitedOn: "2025-02-28",
      lastActive: "2025-03-15"
    },
    {
      id: "5",
      name: "Pending Invitation",
      email: "pending@example.com",
      permissionLevel: "viewer",
      permissions: [
        { area: "transactions", canView: true, canEdit: false },
        { area: "budgets", canView: true, canEdit: false },
        { area: "bills", canView: true, canEdit: false },
        { area: "goals", canView: true, canEdit: false },
        { area: "reports", canView: true, canEdit: false },
        { area: "settings", canView: false, canEdit: false },
        { area: "bankAccounts", canView: true, canEdit: false },
      ],
      status: "pending",
      invitedOn: "2025-03-20"
    }
  ];

  const getPermissionLevelDescription = (level: PermissionLevel) => {
    switch (level) {
      case "owner":
        return "Full access to all features and settings";
      case "admin":
        return "Can manage most features but not account settings";
      case "viewer":
        return "Can view information but cannot make changes";
      case "custom":
        return "Customized access to specific features";
    }
  };

  const getPermissionLevelBadge = (level: PermissionLevel) => {
    switch (level) {
      case "owner":
        return <Badge className="bg-primary">Owner</Badge>;
      case "admin":
        return <Badge className="bg-blue-500">Admin</Badge>;
      case "viewer":
        return <Badge variant="outline">Viewer</Badge>;
      case "custom":
        return <Badge variant="secondary">Custom</Badge>;
    }
  };

  const getStatusBadge = (status: "active" | "pending" | "inactive") => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
    }
  };

  const getAreaName = (area: PermissionArea) => {
    switch (area) {
      case "transactions": return "Transactions";
      case "budgets": return "Budgets";
      case "bills": return "Bills";
      case "goals": return "Goals";
      case "reports": return "Reports";
      case "settings": return "Settings";
      case "bankAccounts": return "Bank Accounts";
    }
  };

  const handleInvite = () => {
    // Mock implementation - in a real app, this would send an invitation email
    console.log("Inviting", inviteEmail, "with permission level", invitePermissionLevel);

    // Reset form
    setInviteEmail("");
    setInvitePermissionLevel("viewer");
    setOpenInviteDialog(false);
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setOpenPermissionsDialog(true);
  };

  const selectedMember = selectedMemberId
    ? familyMembers.find(member => member.id === selectedMemberId)
    : null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Sharing</h1>
            <p className="text-muted-foreground">
              Manage access to your financial information with family members
            </p>
          </div>
          <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Family Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to share your financial data with appropriate permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="permission-level">Permission Level</Label>
                  <Select
                    value={invitePermissionLevel}
                    onValueChange={(value: PermissionLevel) => setInvitePermissionLevel(value)}
                  >
                    <SelectTrigger id="permission-level">
                      <SelectValue placeholder="Select permission level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getPermissionLevelDescription(invitePermissionLevel)}
                  </p>
                </div>

                {invitePermissionLevel === "custom" && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h4 className="font-medium text-sm">Custom Permissions</h4>

                    {(Object.keys(customPermissions) as PermissionArea[]).map((area) => (
                      <div key={area} className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-sm">{getAreaName(area)}</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={customPermissions[area].view}
                            onCheckedChange={(checked) => {
                              setCustomPermissions({
                                ...customPermissions,
                                [area]: { ...customPermissions[area], view: checked }
                              });
                            }}
                          />
                          <Label className="text-sm">View</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={customPermissions[area].edit}
                            disabled={!customPermissions[area].view}
                            onCheckedChange={(checked) => {
                              setCustomPermissions({
                                ...customPermissions,
                                [area]: { ...customPermissions[area], edit: checked }
                              });
                            }}
                          />
                          <Label className="text-sm">Edit</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
                <Button onClick={handleInvite}>Send Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Family Members</CardTitle>
            <CardDescription>
              People who have access to your financial information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familyMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{getPermissionLevelBadge(member.permissionLevel)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      {member.lastActive
                        ? new Date(member.lastActive).toLocaleDateString()
                        : "Never"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {member.status === "pending" && (
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        )}
                        {member.permissionLevel !== "owner" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectMember(member.id)}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Permissions
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={openPermissionsDialog} onOpenChange={setOpenPermissionsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Permissions</DialogTitle>
              <DialogDescription>
                {selectedMember?.name} - {selectedMember?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-permission-level">Permission Level</Label>
                <Select defaultValue={selectedMember?.permissionLevel}>
                  <SelectTrigger id="edit-permission-level">
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md p-4 space-y-2">
                <h4 className="font-medium text-sm mb-3">Access Permissions</h4>

                {selectedMember?.permissions.map((permission) => (
                  <div key={permission.area} className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-sm">{getAreaName(permission.area)}</Label>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked={permission.canView} />
                      <Label className="text-sm">View</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        defaultChecked={permission.canEdit}
                        disabled={!permission.canView}
                      />
                      <Label className="text-sm">Edit</Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="flex sm:justify-between">
              <Button variant="destructive" size="sm" className="hidden sm:flex">
                <Trash2 className="h-4 w-4 mr-1" />
                Remove Access
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpenPermissionsDialog(false)}>Cancel</Button>
                <Button onClick={() => setOpenPermissionsDialog(false)}>Save Changes</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Access History</CardTitle>
            <CardDescription>
              Recent activity from family members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium">John Doe viewed your Transactions</p>
                  <p className="text-sm text-muted-foreground">2025-03-22 at 10:45 AM</p>
                </div>
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium">John Doe edited the Monthly Budget</p>
                  <p className="text-sm text-muted-foreground">2025-03-21 at 3:20 PM</p>
                </div>
                <Edit className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium">Sarah Smith viewed your Bills</p>
                  <p className="text-sm text-muted-foreground">2025-03-20 at 5:15 PM</p>
                </div>
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium">Alex Johnson edited a Bill</p>
                  <p className="text-sm text-muted-foreground">2025-03-20 at 2:10 PM</p>
                </div>
                <Edit className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="font-medium">Alex Johnson viewed the Financial Reports</p>
                  <p className="text-sm text-muted-foreground">2025-03-19 at 11:30 AM</p>
                </div>
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Activity</Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
