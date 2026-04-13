import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import I18nDirection from './components/i18n/I18nDirection';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Activate from './pages/auth/Activate';
import Dashboard from './pages/Dashboard';
import Groups from './pages/groups/Groups';
import GroupDetail from './pages/groups/GroupDetail';
import GroupChat from './pages/chat/GroupChat';
import Profile from './pages/profile/Profile';
import Notifications from './pages/Notifications';
import JoinGroup from './pages/groups/JoinGroup';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';
import ActivationSuccess from './pages/auth/ActivationSuccess';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
function App() {
    return (<ErrorBoundary>
        <Router>
            <AuthProvider>
                <I18nDirection />
                <div className="min-h-screen overflow-x-hidden">
                        <Routes>
                            
                            <Route element={<PublicRoute />}>
                                <Route path="/login" element={<Login />}/>
                                <Route path="/register" element={<Register />}/>
                                <Route path="/activate/:code" element={<Activate />}/>
                                <Route path="/activation-success" element={<ActivationSuccess />}/>
                                <Route path="/forgot-password" element={<ForgotPassword />}/>
                                <Route path="/reset-password" element={<ResetPassword />}/>
                            </Route>

                            
                            <Route element={<PrivateRoute />}>
                                <Route element={<Layout />}>
                                    <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                                    <Route path="/dashboard" element={<Dashboard />}/>
                                    <Route path="/groups" element={<Groups />}/>
                                    <Route path="/join/:token" element={<JoinGroup />}/>
                                    <Route path="/groups/:id" element={<GroupDetail />}/>
                                    <Route path="/chat/:groupId" element={<GroupChat />}/>
                                    <Route path="/profile" element={<Profile />}/>
                                    <Route path="/notifications" element={<Notifications />}/>
                                </Route>
                            </Route>

                            
                            <Route path="*" element={<NotFound />}/>
                        </Routes>
                </div>
            </AuthProvider>
        </Router>
        </ErrorBoundary>);
}
export default App;
