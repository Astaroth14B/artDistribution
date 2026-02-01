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
    const dropdownRef = useRef(null);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <header className="header">
            <div className="site-logo">
                <h2 className="name">
                    ASTAROTH'S SECRET
                </h2>
            </div>
            <nav className="nav-bar">
                <Link to="/" className={`press ${isActive('/')}`}>Home</Link>
                <Link to="/gallery" className={`press ${isActive('/gallery')}`}>Gallery</Link>
                <span
                    className="press"
                    onClick={() => {
                        if (user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date())) {
                            alert(`YOU ARE IN TIMEOUT. REASON: ${user.bannedReason || 'UNSPECIFIED'}. RELEASE AT: ${user.banUntil ? new Date(user.banUntil).toLocaleString() : 'THE END OF TIME'}`);
                            return;
                        }
                        openUploadModal();
                    }}
                    style={{
                        cursor: 'pointer',
                        marginLeft: '30px',
                        fontFamily: 'var(--font-header)',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem',
                        letterSpacing: '1.5px',
                        color: user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date()) ? 'var(--accent-burgundy)' : 'var(--text-dim)',
                        opacity: user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date()) ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                        if (!(user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date()))) {
                            e.target.style.color = 'var(--accent-gold)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!(user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date()))) {
                            e.target.style.color = 'var(--text-dim)';
                        }
                    }}
                >
                    Upload
                </span>

                <div style={{ marginLeft: '40px', display: 'inline-flex', alignItems: 'center', gap: '20px' }}>
                    {user ? (
                        <div style={{ position: 'relative', display: 'inline-block' }} className="user-menu-wrapper">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {user.isAdmin && (
                                    <Link to="/admin" className="cyber-btn" style={{
                                        background: 'var(--accent-gold)',
                                        color: '#fff',
                                        border: '1px solid var(--accent-gold)',
                                        fontSize: '0.7rem',
                                        padding: '6px 12px',
                                        textDecoration: 'none',
                                        boxShadow: '0 0 10px rgba(184, 134, 11, 0.2)',
                                        borderRadius: '4px'
                                    }}>
                                        ARCHIVE ADMIN
                                    </Link>
                                )}
                                <div
                                    className="profile-trigger"
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                    ref={dropdownRef}
                                    onClick={toggleDropdown}
                                >
                                    <img
                                        src={user.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : 'https://via.placeholder.com/30'}
                                        alt="profile"
                                        style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)', display: 'block' }}
                                    />

                                    <div className={`user-dropdown-menu ${isDropdownOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                                        <p className="user-name-label">{user.username}</p>
                                        <p className="serial-id-label">
                                            SERIAL ID: <span>{user.serialNumber || '000000000000'}</span>
                                        </p>
                                        <hr className="dropdown-divider" />
                                        <Link to="/profile" className="dropdown-link" onClick={() => setIsDropdownOpen(false)}>MY ACCOUNT</Link>
                                        <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="logout-btn">
                                            LOGOUT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="press" onClick={() => openAuthModal('login')} style={{
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '10px 20px',
                            color: '#fff',
                            background: 'var(--accent-gold)',
                            border: 'none',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-header)',
                            boxShadow: '0 2px 8px rgba(197, 160, 89, 0.3)'
                        }}>
                            SIGN IN
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
