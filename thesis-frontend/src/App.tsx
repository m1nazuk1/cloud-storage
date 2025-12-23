import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Activate from './pages/auth/Activate'
import Dashboard from './pages/Dashboard'
import Groups from './pages/groups/Groups'
import GroupDetail from './pages/groups/GroupDetail'
import Profile from './pages/profile/Profile'
import NotFound from './pages/NotFound'
import PrivateRoute from './components/routes/PrivateRoute'
import PublicRoute from './components/routes/PublicRoute'
import ActivationSuccess from './pages/auth/ActivationSuccess'
import ForgotPassword from './pages/auth/ForgotPassword' // Добавляем
import ResetPassword from './pages/auth/ResetPassword' // Добавляем

//import Notifications from './pages/Notifications'


function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <div className="min-h-screen bg-gray-50">
                        <Routes>
                            {/* Public routes */}
                            <Route element={<PublicRoute />}>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/activate/:code" element={<Activate />} />
                                <Route path="/activation-success" element={<ActivationSuccess />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                            </Route>

                            {/* Protected routes */}
                            <Route element={<PrivateRoute />}>
                                <Route element={<Layout />}>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/groups" element={<Groups />} />
                                    <Route path="/groups/:id" element={<GroupDetail />} />
                                    <Route path="/profile" element={<Profile />} />
                                    {/*<Route path="/notification" element={<Notifications />} />*/}
                                </Route>
                            </Route>

                            {/* 404 */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </div>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#1f2937',
                                color: '#f9fafb',
                                borderRadius: '0.5rem',
                                border: '1px solid #374151',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#ffffff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#ffffff',
                                },
                            },
                        }}
                    />
                </SocketProvider>
            </AuthProvider>
        </Router>
    )
}

export default App