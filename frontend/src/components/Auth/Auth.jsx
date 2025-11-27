import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import '../../styles/components/Auth.css';

/**
 * Main Auth component that handles login/register switching
 */
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return isLogin ? (
    <Login onSwitchToRegister={switchToRegister} />
  ) : (
    <Register onSwitchToLogin={switchToLogin} />
  );
};

export default Auth;