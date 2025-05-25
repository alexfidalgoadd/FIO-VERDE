import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Members from "@/pages/Members";
import MemberDetail from "@/pages/MemberDetail";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Dispensary from "@/pages/Dispensary";
import AccessControl from "@/pages/AccessControl";
import Accounting from "@/pages/Accounting";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import { useAuthGuard } from "@/lib/auth";

function Router() {
  const isAuthenticated = useAuthGuard();

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route>
          <Login />
        </Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/members" component={Members} />
        <Route path="/members/:id" component={MemberDetail} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/dispensary" component={Dispensary} />
        <Route path="/access" component={AccessControl} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
