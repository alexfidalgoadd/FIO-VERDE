import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import MemberDetail from "@/components/members/MemberDetail";
import MemberForm from "@/components/members/MemberForm";
import { LuArrowLeft } from "react-icons/lu";
import { MemberWithUser } from "@shared/schema";

export default function MemberDetailPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: member, isLoading, refetch } = useQuery<MemberWithUser>({
    queryKey: [`/api/members/${id}`],
  });

  const handleOpenEditDialog = () => {
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    refetch();
  };

  const handleBackToList = () => {
    setLocation("/members");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          size="sm"
          className="mb-6"
          onClick={handleBackToList}
        >
          <LuArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
        <Card className="p-6">
          <CardContent className="p-0">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          size="sm"
          className="mb-6"
          onClick={handleBackToList}
        >
          <LuArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
        <Card className="p-6">
          <CardContent className="p-0 text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">Socio no encontrado</p>
            <Button variant="link" onClick={handleBackToList}>
              Volver a la lista de socios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="outline" 
        size="sm"
        className="mb-6"
        onClick={handleBackToList}
      >
        <LuArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
      </Button>

      <Card className="p-6">
        <CardContent className="p-0">
          <MemberDetail 
            memberId={parseInt(id)} 
            onEdit={handleOpenEditDialog} 
          />
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
          </DialogHeader>
          <MemberForm 
            initialValues={member} 
            onSuccess={handleCloseEditDialog} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
