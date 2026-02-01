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
                <div className="profile-header" style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    alignItems: 'center',
                    gap: '40px',
                    background: 'rgba(255,255,255,0.85)',
                    padding: '40px',
                    border: '1px solid var(--accent-gold)',
                    boxShadow: '0 5px 25px rgba(0,0,0,0.05)',
                    borderRadius: '8px'
                }}>
                    <div className="profile-pic">
                        <img
                            src={user.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : 'https://via.placeholder.com/150'}
                            alt={user.username}
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid var(--accent-gold)',
                                boxShadow: '0 0 20px rgba(184, 134, 11, 0.2)'
                            }}
                        />
                    </div>
                    <div className="profile-info" style={{ flex: 1, width: '100%', color: 'var(--text-sepia)' }}>
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
                                <h2 style={{ fontSize: '3em', margin: 0, fontFamily: 'var(--font-header)', color: 'var(--accent-gold)' }}>{user.username}</h2>
                                <p className="serial-id-label" style={{
                                    color: 'var(--text-sepia)',
                                    fontSize: '1em',
                                    fontFamily: 'monospace',
                                    marginTop: '10px',
                                    background: 'var(--accent-gold-glow)',
                                    display: 'inline-block',
                                    padding: '5px 15px',
                                    border: '1px solid var(--accent-gold)',
                                    borderRadius: '4px'
                                }}>
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
            `}</style>
        </div>
    );
};

export default Profile;
