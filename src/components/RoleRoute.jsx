import { useLocation } from 'react-router-dom';
import AccessDenied from './AccessDenied';
import { puedeVerRuta } from '../utils/roles';

function RoleRoute({ role, routeKey, children }) {
  const location = useLocation();

  if (!puedeVerRuta(role, routeKey)) {
    return <AccessDenied path={location.pathname} />;
  }

  return children;
}

export default RoleRoute;
