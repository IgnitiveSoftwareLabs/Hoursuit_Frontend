import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./Redux/Store";
import { UserProvider } from "./Context/UserContext";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
     
        <BrowserRouter>
        <UserProvider>
          <App />
        </UserProvider>
      </BrowserRouter>
    </Provider>
    
  </StrictMode>
);