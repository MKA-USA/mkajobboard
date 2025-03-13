import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import MKALogo from './MKALogo';

const Layout = () => {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-brand-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <MKALogo className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-brand-dark">MKA USA</span>
              <span className="text-xs text-muted-foreground">Job Board</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-brand-dark transition-colors">Home</Link>
            <Link to="/jobs" className="text-foreground hover:text-brand-dark transition-colors">Jobs</Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin/dashboard" className="text-foreground hover:text-brand-dark transition-colors">Dashboard</Link>
                <Button 
                  onClick={logout} 
                  variant="ghost"
                  className="text-foreground hover:text-brand-dark hover:bg-brand-50 transition-colors"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/admin/login">
                <Button variant="outline" className="border-brand hover:border-brand-dark text-brand-dark hover:bg-brand-50">
                  Admin Login
                </Button>
              </Link>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white border-t border-brand-100 py-4 px-6 flex flex-col gap-4">
            <Link 
              to="/" 
              className="py-2 text-foreground hover:text-brand-dark transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/jobs" 
              className="py-2 text-foreground hover:text-brand-dark transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Jobs
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className="py-2 text-foreground hover:text-brand-dark transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Button 
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }} 
                  variant="ghost"
                  className="justify-start px-0 text-foreground hover:text-brand-dark hover:bg-transparent"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link 
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="outline" className="w-full border-brand text-brand-dark">
                  Admin Login
                </Button>
              </Link>
            )}
          </nav>
        )}
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-brand-50 py-8 border-t border-brand-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-dark mb-4">MKA USA Job Board</h3>
              <p className="text-sm text-muted-foreground">
                A platform exclusively for Khuddam to find job opportunities and help fellow members secure employment.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-brand-dark transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/jobs" className="text-muted-foreground hover:text-brand-dark transition-colors">Browse Jobs</Link>
                </li>
                <li>
                  <a href="https://mkausa.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand-dark transition-colors">
                    MKA USA Website
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For questions or assistance, please contact the Sanat-o-Tijarat Department.
              </p>
              <a 
                href="mailto:jobs@mkausa.org" 
                className="text-sm text-brand-dark hover:text-brand-500 transition-colors"
              >
                jobs@mkausa.org
              </a>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-brand-100 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Majlis Khuddamul Ahmadiyya USA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
