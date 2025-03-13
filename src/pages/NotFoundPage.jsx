import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ChevronLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-brand-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <span className="text-5xl font-bold text-brand">404</span>
      </div>
      <h2 className="text-2xl font-semibold text-brand-dark mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link to="/">
          <Button className="bg-brand hover:bg-brand-dark">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
        <Link to="/jobs">
          <Button variant="outline" className="border-brand text-brand-dark hover:bg-brand-50">
            Browse Jobs
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
