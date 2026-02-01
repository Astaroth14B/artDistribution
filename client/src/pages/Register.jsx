import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; // Import axios directly if needed or use auth context
import API_URL from '../config';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        profilePic: null
    });
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, profilePic: file });
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const nextStep = () => {
        if (step === 1 && !formData.email) return setError('Email is required');
        if (step === 2 && (!formData.username || !formData.password)) return setError('Username and Password are required');
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use FormData for file upload
        const data = new FormData();
        data.append('username', formData.username);
        data.append('email', formData.email);
        data.append('password', formData.password);
        if (formData.profilePic) {
            data.append('profilePic', formData.profilePic);
        }

        // We need to pass FormData to the register function. 
        // Ensure AuthContext.js handles FormData or we might need to modify it or call API directly here.
        // Assuming AuthContext's register accepts the data object. 
        // If AuthContext expects JSON, we might need to adjust it. 
        // For now, let's assume we can pass the FormData or handle it here.

        try {
            // DIRECT API CALL if AuthContext logic is JSON-bound (safer assumption for now)
            // Or try using the context function if it's flexible. 
            // Let's rely on context but we'll need to check if we can pass a second arg for content-type
            // OR we just directly call axios here to be safe and then login via context.

            const res = await axios.post(`${API_URL}/api/v1/auth/register`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // After successful register, auto-login or redirect
            // We can manually set the token or just redirect to login
            // For better UX, let's try to auto-login using the token received
            if (res.data.token) {
                // Creating a manual login effect might be tricky without access to 'setAuth' from context directly
                // So we might just redirect to login or show success.
                // Actually, let's just use the context's loadUser logic if we can, or just redirect.
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div className="page-content">
            <div className="contact" style={{ marginTop: '50px' }}>
                <div className="cyber-form">
                    <h3><span className="neon-text">NEW</span> USER</h3>
                    <div className="steps-indicator" style={{ textAlign: 'center', marginBottom: '20px', color: 'cyan' }}>
                        STEP {step} / 3
                    </div>

                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                    <form onSubmit={(e) => e.preventDefault()}>
                        {step === 1 && (
                            <div className="sec">
                                <label>ENTER GMAIL / EMAIL</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    placeholder="user@example.com"
                                    onChange={handleChange}
                                    required
                                />
                                <button className="cyber-btn" onClick={nextStep} style={{ width: '100%', marginTop: '10px' }}>NEXT</button>
                            </div>
                        )}

                        {step === 2 && (
                            <>
                                <div className="sec">
                                    <label>SET USERNAME</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        placeholder="USERNAME"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="sec">
                                    <label>SET PASSWORD</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        placeholder="PASSWORD"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="cyber-btn" onClick={prevStep} style={{ flex: 1 }}>BACK</button>
                                    <button className="cyber-btn" onClick={nextStep} style={{ flex: 1 }}>NEXT</button>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div className="sec" style={{ textAlign: 'center' }}>
                                    <label>UPLOAD PROFILE PICTURE</label>
                                    <div style={{ margin: '20px 0' }}>
                                        {preview ? (
                                            <img src={preview} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid cyan' }} />
                                        ) : (
                                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed #555', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                                NO IMG
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        name="profilePic"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cyber-btn" style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center', padding: '10px' }}>
                                        CHOOSE FILE
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button className="cyber-btn" onClick={prevStep} style={{ flex: 1 }}>BACK</button>
                                    <button className="cyber-btn" onClick={handleSubmit} style={{ flex: 1 }}>REGISTER</button>
                                </div>
                            </>
                        )}
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                        Already authenticated? <Link to="/login" style={{ color: 'cyan' }}>Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
