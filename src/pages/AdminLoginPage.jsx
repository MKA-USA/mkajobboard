import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { handleError } from '../lib/errors';
import { useToast } from '../components/ui/use-toast';
import { Lock } from 'lucide-react';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/admin/dashboard');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { success, message } = await login(formData.username, formData.password);
      
      if (success) {
        navigate('/admin/dashboard');
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard.",
        });
      } else {
        setFormErrors({
          general: message || 'Login failed. Please check your credentials.'
        });
      }
    } catch (err) {
      handleError(err, toast);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 mb-4">
          <Lock className="h-8 w-8 text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark">Admin Login</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to manage job listings for MKA USA Job Board
        </p>
      </div>
      
      <div className="bg-white border border-brand-100 rounded-lg shadow-sm p-6">
        {formErrors.general && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6">
            {formErrors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className={formErrors.username ? "text-destructive" : ""}>
              Username
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={formErrors.username ? "border-destructive" : "border-brand-100"}
            />
            {formErrors.username && (
              <p className="text-destructive text-sm">{formErrors.username}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className={formErrors.password ? "text-destructive" : ""}>
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={formErrors.password ? "border-destructive" : "border-brand-100"}
            />
            {formErrors.password && (
              <p className="text-destructive text-sm">{formErrors.password}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand hover:bg-brand-dark mt-2" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Return to{' '}
            <Link to="/" className="text-brand hover:text-brand-dark">
              Job Board
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          For access to the admin dashboard, please contact the Sanat-o-Tijarat Department.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
