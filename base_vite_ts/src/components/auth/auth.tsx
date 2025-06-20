import React from 'react';
import { Navigate } from 'react-router-dom';

// Define the expected props for ProtectedRoute
interface ProtectedRouteProps {
  component: React.ComponentType<any>; // 'component' should be a React component type (functional or class)
  [key: string]: any; // Allow any other props passed via ...rest
}

// Use React.FC to explicitly type the functional component,
// and define the props type using the interface
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken'); // Check if the user is authenticated

  // Return the component or Navigate based on authentication status
  // This syntax is valid JSX and will be parsed correctly in a .tsx file
  return isAuthenticated ? <Component {...rest} /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;