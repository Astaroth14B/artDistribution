import React, { useState } from 'react';
import axios from 'axios';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const UploadModal = ({ onUploadSuccess }) => {
    const { isUploadModalOpen, closeUploadModal } = useUI();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: null
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('SHARING...');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('image', formData.image);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/v1/art/upload`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token
                }
            });
            setStatus('SHARED SUCCESSFULLY');
            setTimeout(() => {
                setStatus('');
                setFormData({ title: '', description: '', image: null });
                closeUploadModal();
                if (onUploadSuccess) onUploadSuccess();
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus('GENERIC ERROR - TRY AGAIN');
        }
    };

    if (!isUploadModalOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.className === 'modal' && closeUploadModal()}>
            <div className="contact-content" style={{ position: 'relative', zIndex: 2001, width: '100%', maxWidth: '500px' }}>
                <div className="cyber-form" style={{ width: '100%', boxSizing: 'border-box' }}>
                    <button
                        onClick={closeUploadModal}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '20px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-sepia)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        &times;
                    </button>

                    <h3>CONTRIBUTE <span className="highlight">ART</span></h3>
                    <p style={{ textAlign: 'center', marginBottom: '30px', fontFamily: 'var(--font-alt)' }}>Share your drawing with the world.</p>

                    {user && user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date()) ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-burgundy)' }}>
                            <h2 style={{ fontFamily: 'var(--font-header)', letterSpacing: '2px' }}>YOU ARE SILENCED</h2>
                            <p style={{ marginTop: '20px', fontFamily: 'var(--font-alt)' }}>The Archive Council has placed you in a temporary timeout.</p>
                            <div style={{ margin: '20px 0', border: '1px dashed var(--accent-burgundy)', padding: '15px' }}>
                                <b>REASON:</b> {user.bannedReason || 'Unspecified transgression.'}
                                <br />
                                <b>RELEASE:</b> {user.banUntil ? new Date(user.banUntil).toLocaleString() : 'Indefinite'}
                            </div>
                            <button className="cyber-btn" onClick={closeUploadModal} style={{ width: '100%', marginTop: '20px' }}>UNDERSTOOD</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="sec">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    placeholder="DRAWING TITLE"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sec">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    placeholder="THE STORY BEHIND THIS PIECE..."
                                    onChange={handleChange}
                                    style={{ height: '100px' }}
                                ></textarea>
                            </div>
                            <div className="sec">
                                <label htmlFor="modal-file-upload" className="cyber-btn" style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}>
                                    {formData.image ? `SELECTED: ${formData.image.name.substring(0, 20)}...` : "CHOOSE DRAWING FILE"}
                                </label>
                                <input
                                    id="modal-file-upload"
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    required
                                />
                            </div>
                            <button className="cyber-btn" style={{ width: '100%', marginTop: '10px' }}>
                                {status || "PUBLISH TO GALLERY"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
