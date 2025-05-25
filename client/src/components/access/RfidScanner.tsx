import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccessType } from "@shared/schema";
import { LuScan, LuCheckCircle, LuXCircle } from "react-icons/lu";

interface ScanResult {
  member: {
    id: number;
    fullName: string;
    memberNumber: string;
  };
  accessType: AccessType;
  timestamp: Date;
}

export function RfidScanner() {
  const { toast } = useToast();
  const [rfidInput, setRfidInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [focusInput, setFocusInput] = useState(true);

  const inputRef = useState<HTMLInputElement | null>(null);

  // Focus the input field when component mounts or refocus is requested
  useEffect(() => {
    if (focusInput && inputRef[0]) {
      inputRef[0].focus();
    }
  }, [focusInput, inputRef]);

  // Handle RFID scan
  const handleScan = async () => {
    if (!rfidInput.trim()) {
      toast({
        title: "Error",
        description: "Introduce un código RFID válido",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);

    try {
      const response = await apiRequest("POST", "/api/access/rfid", { rfidTag: rfidInput });
      const data = await response.json();

      setLastScan({
        member: data.member,
        accessType: data.accessType,
        timestamp: new Date(),
      });

      // Display success toast
      toast({
        title: "Acceso registrado",
        description: `${data.member.fullName} - ${data.accessType === AccessType.ENTRY ? "Entrada" : "Salida"}`,
        variant: "default",
      });

      // Clear input field
      setRfidInput("");
      
      // Refetch access logs
      queryClient.invalidateQueries({ queryKey: ["/api/access"] });
      
    } catch (error: any) {
      console.error("Error during RFID scan:", error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar el acceso con RFID",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      setFocusInput(true);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRfidInput(e.target.value);
  };

  // Handle key press (Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LuScan className="mr-2" />
          Escáner RFID
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2">
          <Input
            ref={(el) => (inputRef[0] = el)}
            value={rfidInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Escanea tarjeta RFID o introduce código manualmente"
            className="flex-1"
            disabled={scanning}
            autoFocus
            onBlur={() => setFocusInput(false)}
            onFocus={() => setFocusInput(false)}
          />
          <Button onClick={handleScan} disabled={scanning || !rfidInput.trim()}>
            {scanning ? "Escaneando..." : "Escanear"}
          </Button>
        </div>

        {lastScan && (
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center mb-2">
              <div className={`rounded-full p-2 mr-3 ${
                lastScan.accessType === AccessType.ENTRY
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}>
                {lastScan.accessType === AccessType.ENTRY ? (
                  <LuCheckCircle className="text-green-500 dark:text-green-400" size={20} />
                ) : (
                  <LuXCircle className="text-red-500 dark:text-red-400" size={20} />
                )}
              </div>
              <div>
                <h3 className="font-medium">{lastScan.member.fullName}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  #{lastScan.member.memberNumber}
                </p>
              </div>
              <Badge
                className="ml-auto"
                variant={lastScan.accessType === AccessType.ENTRY ? "success" : "destructive"}
              >
                {lastScan.accessType === AccessType.ENTRY ? "Entrada" : "Salida"}
              </Badge>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Último acceso registrado hace {Math.floor((new Date().getTime() - new Date(lastScan.timestamp).getTime()) / 1000)} segundos
            </div>
          </div>
        )}

        <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>Escanea la tarjeta RFID del socio o introduce el código manualmente para registrar la entrada o salida.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default RfidScanner;
