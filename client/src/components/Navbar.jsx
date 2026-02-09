import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const Navbar = () => {
    const location = useLocation();
    const { openReviewModal, openUploadModal, openAuthModal } = useUI();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('.hamburger-menu')) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isDropdownOpen || isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, isMobileMenuOpen]);

    const handleUploadClick = () => {
        if (user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date())) {
            alert(`YOU ARE IN TIMEOUT. REASON: ${user.bannedReason || 'UNSPECIFIED'}. RELEASE AT: ${user.banUntil ? new Date(user.banUntil).toLocaleString() : 'THE END OF TIME'}`);
            return;
        }
        openUploadModal();
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="site-logo">
                <h2 className="name">
                    ASTAROTH'S SECRET
                </h2>
            </div>

            <button className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
                <span></span>
                <span></span>
                <span></span>
            </button>

            <nav className={`nav-bar ${isMobileMenuOpen ? 'mobile-show' : ''}`} ref={mobileMenuRef}>
                <Link to="/" className={`press ${isActive('/')}`} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                <Link to="/gallery" className={`press ${isActive('/gallery')}`} onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
                <span
                    className={`press upload-nav-btn ${user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date()) ? 'banned' : ''}`}
                    onClick={handleUploadClick}
                >
                    Upload
                </span>

                <div className="nav-auth-section">
                    {user ? (
                        <div className="user-menu-wrapper">
                            <div className="user-menu-content">
                                {user.isAdmin && (
                                    <Link to="/admin" className="admin-btn" onClick={() => setIsMobileMenuOpen(false)}>
                                        ARCHIVE ADMIN
                                    </Link>
                                )}
                                <div
                                    className="profile-trigger"
                                    ref={dropdownRef}
                                    onClick={toggleDropdown}
                                >
                                    <img
                                        src={user.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : 'https://via.placeholder.com/30'}
                                        alt="profile"
                                        className="navbar-profile-pic"
                                    />

                                    <div className={`user-dropdown-menu ${isDropdownOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                                        <p className="user-name-label">{user.username}</p>
                                        <p className="serial-id-label">
                                            SERIAL ID: <span>{user.serialNumber || '000000000000'}</span>
                                        </p>
                                        <hr className="dropdown-divider" />
                                        <Link to="/profile" className="dropdown-link" onClick={() => { setIsDropdownOpen(false); setIsMobileMenuOpen(false); }}>MY ACCOUNT</Link>
                                        <button onClick={() => { logout(); setIsDropdownOpen(false); setIsMobileMenuOpen(false); }} className="logout-btn">
                                            LOGOUT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button className="signin-btn" onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false); }}>
                            SIGN IN
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
