import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MemberList from "@/components/members/MemberList";
import MemberForm from "@/components/members/MemberForm";
import { LuUsers } from "react-icons/lu";

export default function Members() {
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);

  const handleOpenNewMemberDialog = () => {
    setIsNewMemberDialogOpen(true);
  };

  const handleCloseNewMemberDialog = () => {
    setIsNewMemberDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <LuUsers className="mr-2" /> Socios
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de socios</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberList onNewMember={handleOpenNewMemberDialog} />
        </CardContent>
      </Card>

      {/* New Member Dialog */}
      <Dialog open={isNewMemberDialogOpen} onOpenChange={setIsNewMemberDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>
          <MemberForm onSuccess={handleCloseNewMemberDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
