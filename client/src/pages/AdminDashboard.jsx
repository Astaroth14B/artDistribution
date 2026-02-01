import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ userCount: 0, artCount: 0, reviewCount: 0 });
    const [activeTab, setActiveTab] = useState('stats');
    const [users, setUsers] = useState([]);
    const [arts, setArts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Simple security check on mount (also protected by backend)
    useEffect(() => {
        if (user && !user.isAdmin) {
            navigate('/');
        }
    }, [user, navigate]);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/admin/stats`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/admin/users`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchArt = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/admin/art`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setArts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/admin/reviews`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setReviews(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const [selectedUserForBan, setSelectedUserForBan] = useState(null);
    const [banData, setBanData] = useState({ reason: '', until: '' });

    const handleBan = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/v1/admin/users/ban/${selectedUserForBan.id}`, banData, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setSelectedUserForBan(null);
            setBanData({ reason: '', until: '' });
            fetchUsers();
        } catch (err) {
            alert('BAN FAILED: ' + (err.response?.data?.msg || err.message));
        }
    };

    const handleUnban = async (userId) => {
        if (!window.confirm('RELEASE THIS ARTIST FROM TIMEOUT?')) return;
        try {
            await axios.post(`${API_URL}/api/v1/admin/users/unban/${userId}`, {}, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            fetchUsers();
        } catch (err) {
            alert('UNBAN FAILED: ' + (err.response?.data?.msg || err.message));
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        setSearchQuery('');
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'art') fetchArt();
        if (activeTab === 'reviews') fetchReviews();
    }, [activeTab]);

    const deleteItem = async (type, id) => {
        if (!window.confirm(`WARNING: PERMANENT ${type.toUpperCase()} DELETION. EXECUTE?`)) return;
        try {
            await axios.delete(`${API_URL}/api/v1/admin/${type}/${id}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            // Refresh
            if (type === 'users') fetchUsers();
            if (type === 'art') fetchArt();
            if (type === 'reviews') fetchReviews();
            fetchStats();
        } catch (err) {
            alert('DELETION FAILED: ' + (err.response?.data?.msg || err.message));
        }
    };

    const isBanned = (u) => {
        if (!u.bannedState) return false;
        if (!u.banUntil) return true; // Permanent
        return new Date(u.banUntil) > new Date();
    };

    return (
        <div className="page-content">
            <div className="container" style={{ paddingTop: '50px', maxWidth: '1400px', margin: '0 auto', padding: '50px 20px' }}>
                <h1 style={{
                    fontSize: '3rem',
                    textAlign: 'center',
                    marginBottom: '40px',
                    borderBottom: '2px solid var(--accent-gold)',
                    paddingBottom: '20px',
                    fontFamily: 'var(--font-header)',
                    color: 'var(--accent-gold)'
                }}>
                    ARCHIVE ADMINISTRATION
                </h1>

                <div className="admin-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                    {['stats', 'users', 'art', 'reviews'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="cyber-btn"
                            style={{
                                borderColor: activeTab === tab ? 'var(--accent-gold)' : 'var(--accent-gold)',
                                color: activeTab === tab ? '#fff' : 'var(--text-sepia)',
                                boxShadow: activeTab === tab ? '0 4px 15px rgba(197, 160, 89, 0.4)' : 'none',
                                background: activeTab === tab ? 'var(--accent-gold)' : 'rgba(197, 160, 89, 0.05)',
                                opacity: activeTab === tab ? 1 : 0.8
                            }}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>

                {activeTab === 'stats' && (
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
                        {[
                            { label: 'ARTISTS', val: stats.userCount },
                            { label: 'DRAWINGS', val: stats.artCount },
                            { label: 'SCROLLS', val: stats.reviewCount }
                        ].map((s, i) => (
                            <div key={i} style={{
                                border: '1px solid var(--accent-gold)',
                                padding: '40px',
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '8px',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                            }}>
                                <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-header)' }}>{s.label}</h3>
                                <p style={{ fontSize: '4rem', margin: '20px 0', fontFamily: 'var(--font-header)', color: 'var(--text-sepia)' }}>{s.val}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="data-table">
                        <div style={{ marginBottom: '20px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-gold)', fontSize: '1.2rem' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="SEARCH ARCHIVE ARTISTS (Name or Serial)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '4px', border: '1px solid var(--accent-gold)', fontFamily: 'var(--font-alt)', background: 'rgba(255,255,255,0.9)' }}
                            />
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-sepia)', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--accent-gold)', background: 'var(--parchment)' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>ID</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>SERIAL</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>ARTIST</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>EMAIL</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>STATUS</th>
                                    <th style={{ padding: '15px', textAlign: 'right', fontFamily: 'var(--font-header)' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredUsers = users.filter(u =>
                                        (u.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                        (u.serialNumber && u.serialNumber.includes(searchQuery)) ||
                                        (u.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                        (u.id?.toString() === searchQuery)
                                    );
                                    if (filteredUsers.length === 0 && users.length > 0) {
                                        return (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                                    NO ARCHIVE ARTISTS MATCH YOUR DECREE...
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filteredUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--parchment)', background: isBanned(u) ? 'rgba(139, 0, 0, 0.05)' : 'transparent' }}>
                                            <td style={{ padding: '15px' }}>{u.id}</td>
                                            <td style={{ padding: '15px' }}>
                                                <Link to={`/profile/${u.serialNumber}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {u.serialNumber}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <Link to={`/profile/${u.serialNumber}`} style={{ fontWeight: 'bold', color: 'var(--text-sepia)', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.color = 'var(--accent-gold)'} onMouseOut={(e) => e.target.style.color = 'var(--text-sepia)'}>
                                                    {u.username}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '15px' }}>{u.email}</td>
                                            <td style={{ padding: '15px' }}>
                                                {u.isAdmin ? <span style={{ color: 'var(--accent-gold)' }}>MASTER</span> :
                                                    isBanned(u) ? <span style={{ color: 'var(--accent-burgundy)', fontWeight: 'bold' }}>TIMEOUT</span> :
                                                        <span style={{ color: 'var(--text-dim)' }}>ARTIST</span>}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                {!u.isAdmin && (
                                                    <>
                                                        {isBanned(u) ? (
                                                            <button onClick={() => handleUnban(u.id)} className="cyber-btn" style={{ fontSize: '0.65rem', padding: '5px 10px', background: 'green', borderColor: 'green' }}>RECOVER</button>
                                                        ) : (
                                                            <button onClick={() => setSelectedUserForBan(u)} className="cyber-btn" style={{ fontSize: '0.65rem', padding: '5px 10px', background: 'var(--accent-burgundy)', borderColor: 'var(--accent-burgundy)' }}>EXPELL</button>
                                                        )}
                                                        <button onClick={() => deleteItem('users', u.id)} style={{ color: 'var(--accent-burgundy)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 'bold' }}>DELETE</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'art' && (
                    <div className="data-table">
                        <div style={{ marginBottom: '20px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-gold)', fontSize: '1.2rem' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="SEARCH SCROLLS (Title)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '4px', border: '1px solid var(--accent-gold)', fontFamily: 'var(--font-alt)', background: 'rgba(255,255,255,0.9)' }}
                            />
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-sepia)', background: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--accent-gold)', background: 'var(--parchment)' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>ID</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>SERIAL</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>VERSION</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>TITLE</th>
                                    <th style={{ padding: '15px', textAlign: 'right', fontFamily: 'var(--font-header)' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredArts = arts.filter(a =>
                                        (a.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                        (a.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                        (a.userSerial && a.userSerial.includes(searchQuery))
                                    );
                                    if (filteredArts.length === 0 && arts.length > 0) {
                                        return (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                                    NO SCROLLS MATCH YOUR DECREE...
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filteredArts.map(a => (
                                        <tr
                                            key={a.id}
                                            style={{ borderBottom: '1px solid var(--parchment)' }}
                                            onMouseEnter={() => setPreviewImage(`${API_URL}${a.imageUrl}`)}
                                            onMouseLeave={() => setPreviewImage(null)}
                                        >
                                            <td style={{ padding: '15px' }}>{a.id}</td>
                                            <td style={{ padding: '15px' }}>
                                                <Link to={`/profile/${a.userSerial}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {a.userSerial}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <img src={`${API_URL}${a.imageUrl}`} alt="art" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--parchment)' }} />
                                            </td>
                                            <td style={{ padding: '15px', fontFamily: 'var(--font-alt)', fontSize: '1.2rem' }}>{a.title}</td>
                                            <td style={{ padding: '15px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => deleteItem('art', a.id)}
                                                    style={{
                                                        color: '#fff',
                                                        border: 'none',
                                                        background: 'var(--accent-burgundy)',
                                                        padding: '8px 20px',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        fontFamily: 'var(--font-header)',
                                                        fontSize: '0.75rem',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    DISSOLVE
                                                </button>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="data-table">
                        <div style={{ marginBottom: '20px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-gold)', fontSize: '1.2rem' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="SEARCH INSCRIPTIONS (Author or Content)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '4px', border: '1px solid var(--accent-gold)', fontFamily: 'var(--font-alt)', background: 'rgba(255,255,255,0.9)' }}
                            />
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-sepia)', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--accent-gold)', background: 'var(--parchment)' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>ID</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>SERIAL</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>SCRIBE</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontFamily: 'var(--font-header)' }}>INSCRIPTION</th>
                                    <th style={{ padding: '15px', textAlign: 'right', fontFamily: 'var(--font-header)' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredReviews = reviews.filter(r =>
                                        (r.author?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                        (r.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                        (r.authorSerial && r.authorSerial.includes(searchQuery)) ||
                                        (r.userId?.toString() === searchQuery)
                                    );
                                    if (filteredReviews.length === 0 && reviews.length > 0) {
                                        return (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                                    NO INSCRIPTIONS MATCH YOUR DECREE...
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filteredReviews.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--parchment)' }}>
                                            <td style={{ padding: '15px' }}>{r.id}</td>
                                            <td style={{ padding: '15px' }}>
                                                {r.authorSerial ? (
                                                    <Link to={`/profile/${r.authorSerial}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                        {r.authorSerial}
                                                    </Link>
                                                ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>ANCIENT</span>}
                                            </td>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{r.author}</td>
                                            <td style={{ padding: '15px', fontFamily: 'var(--font-alt)' }}>{r.content.substring(0, 50)}...</td>
                                            <td style={{ padding: '15px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                {r.userId && (
                                                    <button
                                                        onClick={() => setSelectedUserForBan({ id: r.userId, username: r.author })}
                                                        className="cyber-btn"
                                                        style={{ fontSize: '0.65rem', padding: '5px 10px', background: 'var(--accent-burgundy)', borderColor: 'var(--accent-burgundy)' }}
                                                    >
                                                        TIMEOUT
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteItem('reviews', r.id)}
                                                    style={{
                                                        color: 'var(--accent-burgundy)',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 'bold',
                                                        padding: '5px'
                                                    }}
                                                >
                                                    VANISH
                                                </button>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}
                {previewImage && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 3000,
                        pointerEvents: 'none',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.95)',
                        border: '2px solid var(--accent-gold)',
                        boxShadow: '0 0 50px rgba(184, 134, 11, 0.5)',
                        animation: 'fadeIn 0.2s ease-out',
                        borderRadius: '8px'
                    }}>
                        <img src={previewImage} alt="Preview" style={{ maxWidth: '80vw', maxHeight: '80vh', display: 'block', borderRadius: '4px' }} />
                    </div>
                )}
                {selectedUserForBan && (
                    <div className="modal show" style={{ display: 'flex', zIndex: 4000 }}>
                        <div className="contact-content" style={{ maxWidth: '450px', width: '90%' }}>
                            <div className="cyber-form">
                                <h3 style={{ fontSize: '1.5rem' }}>TIMEOUT <span className="highlight">DECREE</span></h3>
                                <p style={{ textAlign: 'center', marginBottom: '20px' }}>Select duration for <b>{selectedUserForBan.username}</b></p>

                                <form onSubmit={handleBan}>
                                    <div className="sec">
                                        <label>REASON FOR TIMEOUT</label>
                                        <input
                                            type="text"
                                            placeholder="Violated the shadows..."
                                            value={banData.reason}
                                            onChange={(e) => setBanData({ ...banData, reason: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="sec">
                                        <label>TIME OF RELEASE</label>
                                        <input
                                            type="datetime-local"
                                            value={banData.until}
                                            onChange={(e) => setBanData({ ...banData, until: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="button" className="cyber-btn" onClick={() => setSelectedUserForBan(null)} style={{ flex: 1, background: '#666', borderColor: '#666' }}>CANCEL</button>
                                        <button type="submit" className="cyber-btn" style={{ flex: 1 }}>EXECUTE</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
