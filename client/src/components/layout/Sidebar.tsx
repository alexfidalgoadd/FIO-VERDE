import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Cannabis, 
  Store, 
  Clock, 
  Calculator, 
  LineChart, 
  Settings, 
  LogOut,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

const SidebarItem = ({ href, icon, children, isActive }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-accent-foreground"
        )}
      >
        <span className="w-5 h-5 mr-2">{icon}</span>
        {children}
      </a>
    </Link>
  );
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="mt-4">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider"
      >
        {title}
        <ChevronDown className={cn("w-4 h-4 transition-transform", expanded ? "transform rotate-180" : "")} />
      </button>
      {expanded && <div className="mt-1">{children}</div>}
    </div>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  return (
    <aside className="w-64 bg-sidebar bg-sidebar-background border-r border-sidebar-border shadow-sm h-screen flex flex-col">
      {/* Logo and app name */}
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border px-4">
        <h1 className="text-xl font-semibold text-primary">
          ASOS<span className="text-secondary ml-1">Club</span>
        </h1>
      </div>
      
      {/* Navigation links */}
      <nav className="mt-2 px-2 flex-1 overflow-y-auto">
        <SidebarSection title="General">
          <SidebarItem href="/" icon={<Home className="stroke-current" />} isActive={location === "/"}>
            Dashboard
          </SidebarItem>
          
          <SidebarItem href="/members" icon={<Users className="stroke-current" />} isActive={location.startsWith("/members")}>
            Socios
          </SidebarItem>

          <SidebarItem href="/products" icon={<Cannabis className="stroke-current" />} isActive={location.startsWith("/products")}>
            Productos
          </SidebarItem>

          <SidebarItem href="/dispensary" icon={<Store className="stroke-current" />} isActive={location === "/dispensary"}>
            Dispensario
          </SidebarItem>

          <SidebarItem href="/access" icon={<Clock className="stroke-current" />} isActive={location === "/access"}>
            Control Acceso
          </SidebarItem>
        </SidebarSection>

        <SidebarSection title="Administración">
          <SidebarItem href="/accounting" icon={<Calculator className="stroke-current" />} isActive={location === "/accounting"}>
            Contabilidad
          </SidebarItem>
          
          <SidebarItem href="/reports" icon={<LineChart className="stroke-current" />} isActive={location === "/reports"}>
            Informes
          </SidebarItem>

          <SidebarItem href="/settings" icon={<Settings className="stroke-current" />} isActive={location === "/settings"}>
            Configuración
          </SidebarItem>
        </SidebarSection>
      </nav>

      {/* User profile menu */}
      <div className="border-t border-sidebar-border">
        <div className="p-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </Button>
        </div>
        <div className="flex items-center px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">admin@asosclub.com</p>
          </div>
          <button className="ml-auto text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
