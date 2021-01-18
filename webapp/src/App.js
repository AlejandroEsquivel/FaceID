import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import { StoreProvider } from './store';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './views/Home';
import Login from "./views/Login";


function App() {
  return (
    <StoreProvider>
      <Router>
            <Switch>
                <Route path="/login" component={Login}/>
                <ProtectedRoute path="/" component={Home} />
            </Switch>
        </Router>
    </StoreProvider>
  );
}

export default App;
