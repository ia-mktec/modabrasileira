import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstoqueProvider } from "@/contexts/EstoqueContext";
import Dashboard from "./pages/Dashboard";
import TecidosPage from "./pages/TecidosPage";
import EstoqueTecidosPage from "./pages/EstoqueTecidosPage";
import ModelosPage from "./pages/ModelosPage";
import CortePage from "./pages/CortePage";
import CadastroPage from "./pages/CadastroPage";
import AviamentosPage from "./pages/AviamentosPage";
import ExpedicaoPage from "./pages/ExpedicaoPage";
import RecebimentoPage from "./pages/RecebimentoPage";
import EntregaClientePage from "./pages/EntregaClientePage";
import RelatorioClientesPage from "./pages/RelatorioClientesPage";
import RelatorioProducaoPage from "./pages/RelatorioProducaoPage";
import FluxoCaixaPage from "./pages/FluxoCaixaPage";
import FichaZiperPage from "./pages/FichaZiperPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <EstoqueProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tecidos" element={<TecidosPage />} />
              <Route path="/estoque-tecidos" element={<EstoqueTecidosPage />} />
              <Route path="/modelos" element={<ModelosPage />} />
              <Route path="/corte" element={<CortePage />} />
              <Route path="/cadastro" element={<CadastroPage />} />
              <Route path="/aviamentos" element={<AviamentosPage />} />
              <Route path="/expedicao" element={<ExpedicaoPage />} />
              <Route path="/recebimento" element={<RecebimentoPage />} />
              <Route path="/entrega-cliente" element={<EntregaClientePage />} />
              <Route path="/relatorio-clientes" element={<RelatorioClientesPage />} />
              <Route path="/relatorio-producao" element={<RelatorioProducaoPage />} />
              <Route path="/cash-flow" element={<FluxoCaixaPage />} />
              <Route path="/ficha-ziper" element={<FichaZiperPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </EstoqueProvider>
  </QueryClientProvider>
);

export default App;
