import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RotaProtegida from './components/RotaProtegida'
import Login from './pages/Login'
import Animais from './pages/Animais'
import AnimalDetalhe from './pages/AnimalDetalhe'
import AnimalForm from './pages/AnimalForm'
import Pesagens from './pages/Pesagens'
import PesagemForm from './pages/PesagemForm'
import Vacinas from './pages/Vacinas'
import VacinaForm from './pages/VacinaForm'
import Pendencias from './pages/Pendencias'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/animais" element={<Animais />} />
          <Route path="/animais/:id" element={<AnimalDetalhe />} />
          <Route path="/pesagens" element={<Pesagens />} />
          <Route path="/pesagens/nova" element={<PesagemForm />} />
          <Route path="/vacinas" element={<Vacinas />} />
          <Route path="/vacinas/nova" element={<VacinaForm />} />
          <Route path="/pendencias" element={<Pendencias />} />
          <Route element={<RotaProtegida somenteGerente />}>
            <Route path="/animais/novo" element={<AnimalForm />} />
            <Route path="/animais/:id/editar" element={<AnimalForm />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/animais" replace />} />
    </Routes>
  )
}
