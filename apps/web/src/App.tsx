import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Library } from "./pages/Library";
import { SharedAlbums } from "./pages/SharedAlbums";
import { RecognizedPersons } from "./pages/RecognizedPersons";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/shared-albums" element={<SharedAlbums />} />
          <Route path="/recognized-persons" element={<RecognizedPersons />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
