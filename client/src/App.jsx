import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Cursor from './components/Cursor';
import Loader from './components/Loader';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import ArtistProfile from './pages/ArtistProfile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Cursor />
            <Loader />
            <Navbar />
            <UploadModal />
            <AuthModal />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:serialNumber" element={<ArtistProfile />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
