import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useToast } from '../components/ToastProvider';

const initialState = {
  username: '',
  password: '',
};

const initialErrors = {
  username: '',
  password: '',
};

const Login = () => {
  const [form, setForm]  = useState(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validate = () => {
    const validation = { ...initialErrors };
    if (!form.username.trim()) {
      validation.username = 'Username is required.';
    }
    if (!form.password.trim()) {
      validation.password = 'Password is required.';
    }
    boxSizing: 'border-box';
    setErrors(validation);
    return !validation.username && !validation.password;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    

    setLoading(true);
    try {
      const response = await login({ username: form.username.trim(), password: form.password });
      const { token, role, name, email } = response.data;
      
      // 1. Standard Token and Role Storage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // SAFE EMAIL EXTRACTION: 
      // Agar backend response me email nahi hai, toh username@procuremanage.com bana dega
      const dynamicEmail = email || (form.username.trim() ? `${form.username.trim().toLowerCase()}@procuremanage.com` : 'admin@procuremanage.com');
      const dynamicName = name || form.username.trim() || 'Admin User';

      localStorage.setItem('currentUser', JSON.stringify({
        name: dynamicName,
        email: dynamicEmail, // <-- Saved securely
        role: role === 'ADMIN' ? 'Super Admin' : 'Vendor'
      }));

      showToast({ title: 'Login successful.', message: 'Welcome back to ProcureManage.', variant: 'success' });
      
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');

      } else if( role === 'VENDOR') {
        navigate('/vendor/dashboard');

      }

      else {
        navigate('/user/dashboard');
      }
    } catch (error) {
      console.error("Login Error: ", error);
      showToast({ title: 'Authentication failed.', message: 'Invalid username or password.', variant: 'danger' });
    } finally {
      setLoading(false);
    }

    const response = await login({
    username: form.username.trim(),
    password: form.password
});

console.log("Login Response =>", response.data);

localStorage.setItem("token", response.data.token);

localStorage.setItem(
    "currentUser",
    JSON.stringify({
        id: response.data.id,
        vendorId: response.data.vendorId,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role
    })
);


console.log(
    "Current User =>",
    JSON.parse(localStorage.getItem("currentUser"))
);
  };

  return (
    <div className="login-page d-flex align-items-center min-vh-100 bg-light">
      <div className="container py-5">
        <div className="row g-4 justify-content-center">
          <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center">
            <div className="auth-panel text-white p-5 rounded-4 shadow-lg w-100">
              <div className="mb-5">
                <div className="badge bg-white text-primary mb-3">ProcureManage</div>
                <h1 className="display-6 fw-bold">Vendor Management System</h1>
                <p className="opacity-85 mt-3">
                  A modern enterprise platform for procurement teams and vendors. Secure access with role-aware dashboards and centralized vendor operations.
                </p>
              </div>
              <div className="illustration-box mt-5">
                <div className="illustration-card rounded-4 p-4">
                  <h5 className="mb-3">Welcome back</h5>
                  <p className="mb-0 text-muted">Sign in to manage vendors, review approvals, and monitor procurement workflows in one centralized console.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body p-5">
                <div className="mb-4 text-center">
                  <h2 className="fw-bold">Sign in</h2>
                  <p className="text-muted mb-0">Enter your credentials to access the ProcureManage platform.</p>
                </div>
                <form noValidate onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      placeholder="Enter your username"
                    />
                    {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                      {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                    </div>
                  </div>

                  <div className="d-grid gap-2 mb-4">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      ) : null}
                      {loading ? 'Signing in...' : 'Login'}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="mb-0 text-muted">
                      Don’t have an account?{' '}
                      <Link to="/register" className="text-decoration-none">
                        Register now
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;