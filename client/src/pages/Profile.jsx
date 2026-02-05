import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_URL from '../config';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [myArt, setMyArt] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [status, setStatus] = useState('');

    const fetchMyArt = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/v1/art/my-uploads`, {
                headers: { 'x-auth-token': token }
            });
            if (Array.isArray(res.data)) {
                setMyArt(res.data);
            } else {
                setMyArt([]);
            }
        } catch (err) {
            console.error("Error fetching personal gallery", err);
            setMyArt([]);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
                password: ''
            });
            fetchMyArt();
        }
    }, [user]);

    if (!user) {
        return <div className="page-content" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading Profile...</div>;
    }

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleUpdate = async (e) => {
        e.preventDefault();
        setStatus('SAVING...');
        try {
            const res = await axios.put(`${API_URL}/api/v1/auth/profile`, formData);
            // Update the user in context if AuthContext provides setUser
            if (typeof setUser === 'function') {
                setUser(res.data.user);
            } else {
                // Fallback: force refresh or alert
                window.location.reload();
            }
            setStatus('UPDATE SUCCESSFUL');
            setIsEditing(false);
            setTimeout(() => setStatus(''), 3000);
        } catch (err) {
            setStatus('UPDATE FAILED');
            console.error(err);
        }
    };

    return (
        <div className="page-content">
            <div className="container" style={{ paddingTop: '100px' }}>
                <div className="profile-header-container">
                    <div className="profile-pic">
                        <img
                            src={user.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c5a059'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                            alt={user.username}
                            className="profile-img-circle"
                        />
                    </div>
                    <div className="profile-info-content">
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="cyber-form" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
                                <div className="sec">
                                    <label style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem' }}>IDENTIFIER</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                                </div>
                                <div className="sec">
                                    <label style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem' }}>CORRESPONDENCE</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="sec">
                                    <label style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem' }}>NEW PASSCODE</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="cyber-btn" style={{ flex: 1, background: 'var(--accent-gold)', border: 'none' }}>SAVE SCROLL</button>
                                    <button type="button" className="cyber-btn" onClick={() => setIsEditing(false)} style={{ flex: 1, background: '#888', border: 'none', color: '#fff' }}>CANCEL</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h2 className="profile-username">{user.username}</h2>
                                <p className="serial-id-badge">
                                    SERIAL ID: {user.serialNumber || '000000000000'}
                                </p>
                                <p style={{ color: 'var(--text-dim)', fontSize: '1.2em', marginTop: '15px', fontFamily: 'var(--font-alt)' }}>{user.email}</p>
                                <div style={{ marginTop: '25px', display: 'flex', gap: '15px' }}>
                                    <button className="cyber-btn" onClick={() => setIsEditing(true)}>EDIT PROFILE</button>
                                </div>
                            </>
                        )}
                        {status && <p style={{ marginTop: '15px', color: status.includes('SUCCESS') ? 'green' : 'red', fontWeight: 'bold' }}>{status}</p>}
                    </div>
                </div>

                <div className="user-uploads" style={{ marginTop: '50px' }}>
                    <h3 className="section-title">MY <span className="highlight">CREATIONS</span></h3>
                    <div className="gallery-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '20px',
                        marginTop: '30px'
                    }}>
                        {myArt.length > 0 ? myArt.map(art => (
                            <div key={art.id} className="gallery-item" style={{ background: '#fff' }}>
                                <img src={art.imageUrl} alt={art.title} style={{ border: '1px solid var(--parchment)', borderRadius: '4px' }} />
                                <h4 style={{ color: 'var(--accent-gold)', marginTop: '10px', fontFamily: 'var(--font-header)' }}>{art.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontFamily: 'var(--font-alt)' }}>{art.description}</p>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-dim)', textAlign: 'center', gridColumn: '1 / -1', fontFamily: 'var(--font-alt)', fontSize: '1.2rem' }}>No artifacts found linked to your Serial ID.</p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
                .profile-header-container {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 40px;
                    background: rgba(255,255,255,0.85);
                    padding: 40px;
                    border: 1px solid var(--accent-gold);
                    box-shadow: 0 5px 25px rgba(0,0,0,0.05);
                    borderRadius: 8px;
                }
                .profile-img-circle {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid var(--accent-gold);
                    box-shadow: 0 0 20px rgba(184, 134, 11, 0.2);
                }
                .profile-info-content {
                    flex: 1;
                    width: 100%;
                    color: var(--text-sepia);
                }
                .profile-username {
                    font-size: 3em;
                    margin: 0;
                    font-family: var(--font-header);
                    color: var(--accent-gold);
                }
                .serial-id-badge {
                    color: var(--text-sepia);
                    font-size: 1em;
                    font-family: monospace;
                    margin-top: 10px;
                    background: var(--accent-gold-glow);
                    display: inline-block;
                    padding: 5px 15px;
                    border: 1px solid var(--accent-gold);
                    border-radius: 4px;
                }

                @media (max-width: 768px) {
                    .profile-header-container {
                        flex-direction: column;
                        padding: 30px 20px;
                        gap: 20px;
                        text-align: center;
                    }
                    .profile-username {
                        font-size: 2rem;
                    }
                    .profile-img-circle {
                        width: 120px;
                        height: 120px;
                    }
                    .serial-id-badge {
                        font-size: 0.8rem;
                    }
                }

            `}</style>
        </div>
    );
};

export default Profile;
