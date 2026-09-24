import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin, handleRegister } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")

    const fillDemoCredentials = async () => {
        const demoEmail = "interviewer@demo.com"
        const demoPass = "password123"
        setEmail(demoEmail)
        setPassword(demoPass)
        setError("")

        let res = await handleLogin({ email: demoEmail, password: demoPass })
        if (res && res.success) {
            navigate('/')
        } else {
            // Auto-register demo user if account does not exist yet
            res = await handleRegister({ username: "DemoInterviewer", email: demoEmail, password: demoPass })
            if (res && res.success) {
                navigate('/')
            } else {
                setError(res?.message || "Demo login failed")
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        const res = await handleLogin({ email, password })
        if (res && res.success) {
            navigate('/')
        } else {
            setError(res?.message || "Login failed")
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading...</h1>
            </main>
        )
    }


    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>

                {/* Demo Credentials Box */}
                <div className="demo-box" style={{ background: '#191c1d', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#34d399' }}>🔑 Demo / Interviewer Credentials</span>
                        <button type="button" onClick={fillDemoCredentials} style={{ background: '#10b981', color: '#0c0f10', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                            One-Click Login
                        </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <p><strong>Email:</strong> <code style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '0.2rem' }}>interviewer@demo.com</code></p>
                        <p><strong>Password:</strong> <code style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '0.2rem' }}>password123</code></p>
                    </div>
                </div>

                {error && <p style={{ color: '#f87171', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' >Login</button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login