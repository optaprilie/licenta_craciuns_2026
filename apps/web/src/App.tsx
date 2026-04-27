import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { PrivateLibrary } from "./pages/PrivateLibrary";
import { SharedAlbums } from "./pages/SharedAlbums";
import { RecognizedPersons } from "./pages/RecognizedPersons";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/private-library" element={<PrivateLibrary />} />
        <Route path="/shared-albums" element={<SharedAlbums />} />
        <Route path="/recognized-persons" element={<RecognizedPersons />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
